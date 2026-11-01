-- =====================================================================
-- 0002 — E-mail de contato e recado (restrições alimentares) no RSVP
-- =====================================================================

alter table wedding.invitations
  add column if not exists contact_email text check (contact_email is null or char_length(contact_email) <= 200),
  add column if not exists guest_message text check (guest_message is null or char_length(guest_message) <= 1000);

drop function if exists wedding.submit_rsvp(uuid, jsonb, jsonb, boolean);

create or replace function wedding.submit_rsvp(
  p_invitation_id  uuid,
  p_responses      jsonb,
  p_companion      jsonb,
  p_allow_changes  boolean,
  p_email          text,
  p_message        text
) returns jsonb
language plpgsql as $$
declare
  v_inv            wedding.invitations%rowtype;
  v_guest          wedding.guests%rowtype;
  v_item           jsonb;
  v_status         text;
  v_name           text;
  v_seen           uuid[] := '{}';
  v_guest_count    integer;
  v_already        boolean;
  v_companion_id   uuid;
  v_event_id       uuid;
begin
  -- Bloqueia o convite: submissões simultâneas do mesmo convite são serializadas.
  select * into v_inv from wedding.invitations where id = p_invitation_id for update;
  if not found or not v_inv.active then
    raise exception 'INVITATION_INACTIVE' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_responses) is distinct from 'array' then
    raise exception 'INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  select exists(select 1 from wedding.guests where invitation_id = v_inv.id and attendance_status <> 'pending')
    into v_already;
  if v_already and not p_allow_changes then
    raise exception 'ALREADY_RESPONDED' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_responses) loop
    v_status := v_item->>'status';
    if v_status not in ('attending', 'declined') then
      raise exception 'INVALID_STATUS' using errcode = 'P0001';
    end if;

    select * into v_guest from wedding.guests
      where id = (v_item->>'guest_id')::uuid and invitation_id = v_inv.id
      for update;
    if not found then
      -- Um convidado nunca acessa registros de outro convite.
      raise exception 'GUEST_NOT_IN_INVITATION' using errcode = 'P0001';
    end if;
    if v_guest.id = any(v_seen) then
      raise exception 'DUPLICATE_GUEST' using errcode = 'P0001';
    end if;
    v_seen := v_seen || v_guest.id;

    v_name := nullif(btrim(coalesce(v_item->>'full_name', '')), '');
    if v_name is not null and v_name <> v_guest.full_name then
      if v_guest.name_locked then
        raise exception 'NAME_LOCKED' using errcode = 'P0001';
      end if;
    else
      v_name := v_guest.full_name;
    end if;

    update wedding.guests
       set attendance_status = v_status, responded_at = now(), full_name = v_name
     where id = v_guest.id;
  end loop;

  -- Todos os participantes existentes devem ter uma resposta.
  select count(*) into v_guest_count from wedding.guests where invitation_id = v_inv.id;
  if coalesce(array_length(v_seen, 1), 0) <> v_guest_count then
    raise exception 'MISSING_RESPONSES' using errcode = 'P0001';
  end if;

  -- Acompanhante sem nome previamente definido
  if p_companion is not null and jsonb_typeof(p_companion) = 'object' then
    if not v_inv.allow_unnamed_companion then
      raise exception 'COMPANION_NOT_ALLOWED' using errcode = 'P0001';
    end if;
    if exists(select 1 from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion') then
      raise exception 'COMPANION_ALREADY_EXISTS' using errcode = 'P0001';
    end if;
    v_status := p_companion->>'status';
    if v_status not in ('attending', 'declined') then
      raise exception 'INVALID_STATUS' using errcode = 'P0001';
    end if;
    v_name := btrim(coalesce(p_companion->>'full_name', ''));
    if char_length(v_name) < 2 or char_length(v_name) > 120 then
      raise exception 'INVALID_NAME' using errcode = 'P0001';
    end if;
    if exists(select 1 from wedding.guests where invitation_id = v_inv.id and lower(full_name) = lower(v_name)) then
      raise exception 'DUPLICATE_NAME' using errcode = 'P0001';
    end if;

    -- O gatilho de capacidade garante o limite máximo mesmo sob concorrência.
    insert into wedding.guests (invitation_id, full_name, guest_role, name_locked, attendance_status, responded_at)
    values (v_inv.id, v_name, 'companion', false, v_status, now())
    returning id into v_companion_id;
  end if;

  update wedding.invitations
     set contact_email = nullif(btrim(coalesce(p_email, '')), ''),
         guest_message = nullif(btrim(coalesce(p_message, '')), '')
   where id = v_inv.id;

  insert into wedding.rsvp_events (invitation_id, event_type, details)
  values (
    v_inv.id,
    case when v_already then 'rsvp_updated' else 'rsvp_submitted' end,
    jsonb_build_object(
      'attending', (select count(*) from wedding.guests where invitation_id = v_inv.id and attendance_status = 'attending'),
      'declined',  (select count(*) from wedding.guests where invitation_id = v_inv.id and attendance_status = 'declined')
    )
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'event_id', v_event_id,
    'updated', v_already,
    'guests', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', g.id, 'full_name', g.full_name, 'guest_role', g.guest_role,
        'attendance_status', g.attendance_status
      ) order by g.guest_role desc, g.created_at), '[]'::jsonb)
      from wedding.guests g where g.invitation_id = v_inv.id
    )
  );
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
