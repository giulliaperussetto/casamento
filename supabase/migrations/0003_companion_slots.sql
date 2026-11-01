-- =====================================================================
-- 0003 — Vagas de acompanhante por convite, telefone de cada convidado
--         e opção "não vou levar acompanhante"
--
-- Cada convite tem 1 convidado principal + N vagas de acompanhante
-- (max_guests = 1 + N). O convidado informa nome completo e telefone de
-- cada acompanhante. O limite continua garantido pelo banco.
-- =====================================================================

-- Tipos: 'individual' (sem acompanhante) ou 'group' (com vagas). 'couple' fica por compatibilidade.
alter table wedding.invitations drop constraint if exists invitations_capacity_by_type;
alter table wedding.invitations drop constraint if exists invitations_invitation_type_check;
alter table wedding.invitations drop constraint if exists invitations_type_check;
alter table wedding.invitations add constraint invitations_type_check
  check (invitation_type in ('individual', 'couple', 'group'));
alter table wedding.invitations drop constraint if exists invitations_capacity_check;
alter table wedding.invitations add constraint invitations_capacity_check
  check (max_guests between 1 and 21);

alter table wedding.invitations
  add column if not exists companions_declined boolean not null default false;

alter table wedding.guests
  add column if not exists phone text check (phone is null or phone ~ '^[0-9]{10,13}$');

-- Agora pode haver vários acompanhantes (limitados por max_guests).
drop index if exists wedding.guests_one_companion_per_invitation;
create unique index if not exists guests_unique_name_per_invitation
  on wedding.guests (invitation_id, lower(btrim(full_name)));

create or replace function wedding.enforce_guest_capacity() returns trigger
language plpgsql as $$
declare
  v_inv   wedding.invitations%rowtype;
  v_count integer;
begin
  select * into v_inv from wedding.invitations where id = new.invitation_id for update;
  if not found then
    raise exception 'INVITATION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.invitation_id = old.invitation_id then
    return new;
  end if;
  select count(*) into v_count from wedding.guests where invitation_id = new.invitation_id;
  if v_count >= v_inv.max_guests then
    raise exception 'CAPACITY_EXCEEDED' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Novo envio do RSVP.
-- p_companions: [{ "full_name": text, "phone": text }]  (somente dígitos)
-- Os acompanhantes informados pelo convidado são substituídos a cada envio.
-- ---------------------------------------------------------------------
drop function if exists wedding.submit_rsvp(uuid, jsonb, jsonb, boolean);
drop function if exists wedding.submit_rsvp(uuid, jsonb, jsonb, boolean, text, text);

create or replace function wedding.submit_rsvp_v3(
  p_invitation_id   uuid,
  p_status          text,
  p_phone           text,
  p_companions      jsonb,
  p_no_companions   boolean,
  p_email           text,
  p_message         text,
  p_allow_changes   boolean
) returns jsonb
language plpgsql as $$
declare
  v_inv        wedding.invitations%rowtype;
  v_primary    wedding.guests%rowtype;
  v_item       jsonb;
  v_name       text;
  v_phone      text;
  v_count      integer;
  v_already    boolean;
  v_event_id   uuid;
begin
  select * into v_inv from wedding.invitations where id = p_invitation_id for update;
  if not found or not v_inv.active then
    raise exception 'INVITATION_INACTIVE' using errcode = 'P0001';
  end if;

  if p_status not in ('attending', 'declined') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;
  if p_phone is null or p_phone !~ '^[0-9]{10,13}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_companions, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  select * into v_primary from wedding.guests
   where invitation_id = v_inv.id and guest_role = 'primary' for update;
  if not found then
    raise exception 'INVITATION_INACTIVE' using errcode = 'P0001';
  end if;

  v_already := v_primary.attendance_status <> 'pending';
  if v_already and not p_allow_changes then
    raise exception 'ALREADY_RESPONDED' using errcode = 'P0001';
  end if;

  v_count := jsonb_array_length(coalesce(p_companions, '[]'::jsonb));
  if v_count > v_inv.max_guests - 1 then
    raise exception 'CAPACITY_EXCEEDED' using errcode = 'P0001';
  end if;
  if (p_status = 'declined' or p_no_companions) and v_count > 0 then
    raise exception 'COMPANIONS_NOT_EXPECTED' using errcode = 'P0001';
  end if;
  if p_status = 'attending' and v_inv.max_guests > 1 and v_count = 0 and not p_no_companions then
    raise exception 'COMPANION_CHOICE_REQUIRED' using errcode = 'P0001';
  end if;

  update wedding.guests
     set attendance_status = p_status, responded_at = now(), phone = p_phone
   where id = v_primary.id;

  -- Substitui os acompanhantes (o limite é revalidado pelo gatilho de capacidade).
  delete from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion';

  for v_item in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb)) loop
    v_name := btrim(coalesce(v_item->>'full_name', ''));
    v_phone := coalesce(v_item->>'phone', '');
    if char_length(v_name) < 5 or char_length(v_name) > 120 or position(' ' in v_name) = 0 then
      raise exception 'INVALID_NAME' using errcode = 'P0001';
    end if;
    if v_phone !~ '^[0-9]{10,13}$' then
      raise exception 'INVALID_PHONE' using errcode = 'P0001';
    end if;
    if exists (select 1 from wedding.guests where invitation_id = v_inv.id and lower(btrim(full_name)) = lower(v_name)) then
      raise exception 'DUPLICATE_NAME' using errcode = 'P0001';
    end if;
    insert into wedding.guests (invitation_id, full_name, guest_role, name_locked, attendance_status, responded_at, phone)
    values (v_inv.id, v_name, 'companion', false, 'attending', now(), v_phone);
  end loop;

  update wedding.invitations
     set companions_declined = (p_status = 'attending' and p_no_companions),
         contact_email = nullif(btrim(coalesce(p_email, '')), ''),
         guest_message = nullif(btrim(coalesce(p_message, '')), '')
   where id = v_inv.id;

  insert into wedding.rsvp_events (invitation_id, event_type, details)
  values (
    v_inv.id,
    case when v_already then 'rsvp_updated' else 'rsvp_submitted' end,
    jsonb_build_object('status', p_status, 'companions', v_count, 'no_companions', p_no_companions)
  )
  returning id into v_event_id;

  return jsonb_build_object('event_id', v_event_id, 'updated', v_already);
end $$;

revoke all on all functions in schema wedding from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all functions in schema wedding from %I', r);
    end if;
  end loop;
end $$;
