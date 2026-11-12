-- =====================================================================
-- 0005 — Painel: tags editáveis, controle de envio, configurações
--        (convidados contratados e staff) e confirmação de nome e
--        telefone dos acompanhantes.
-- =====================================================================

-- Tags internas (ex.: Família da Fernanda, Madrinhas). Nunca aparecem no site.
create table if not exists wedding.tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  color       text not null default '#8A4B5E' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now()
);
create unique index if not exists tags_name_unique on wedding.tags (lower(btrim(name)));

alter table wedding.invitations
  add column if not exists tag_id  uuid references wedding.tags(id) on delete set null,
  add column if not exists sent_at timestamptz;

create index if not exists invitations_tag_idx on wedding.invitations (tag_id);

-- Configurações do painel (chave → valor)
create table if not exists wedding.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into wedding.settings (key, value) values
  ('contracted_guests', '100'::jsonb),
  ('staff_count', '0'::jsonb),
  ('staff_weight', '0.5'::jsonb)
on conflict (key) do nothing;

-- Tags iniciais (podem ser renomeadas ou apagadas no painel)
insert into wedding.tags (name, color) values
  ('Família da Fernanda', '#722F37'),
  ('Família da Giullia', '#8A4B5E'),
  ('Madrinhas', '#B7787B'),
  ('Padrinhos', '#6B7A8F'),
  ('Amigos', '#C5A46D')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Envio v5: cada acompanhante confirma nome completo e telefone.
-- p_companions: [{ "guest_id": uuid, "status": "attending"|"declined",
--                  "full_name": text, "phone": text }]
-- ---------------------------------------------------------------------
create or replace function wedding.submit_rsvp_v5(
  p_invitation_id   uuid,
  p_status          text,
  p_phone           text,
  p_companions      jsonb,
  p_email           text,
  p_message         text,
  p_allow_changes   boolean
) returns jsonb
language plpgsql as $$
declare
  v_inv        wedding.invitations%rowtype;
  v_primary    wedding.guests%rowtype;
  v_item       jsonb;
  v_guest      wedding.guests%rowtype;
  v_seen       uuid[] := '{}';
  v_total      integer;
  v_status     text;
  v_name       text;
  v_cphone     text;
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

  update wedding.guests
     set attendance_status = p_status, responded_at = now(), phone = p_phone
   where id = v_primary.id;

  for v_item in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb)) loop
    select * into v_guest from wedding.guests
     where id = (v_item->>'guest_id')::uuid and invitation_id = v_inv.id and guest_role = 'companion'
     for update;
    if not found then
      raise exception 'GUEST_NOT_IN_INVITATION' using errcode = 'P0001';
    end if;
    if v_guest.id = any(v_seen) then
      raise exception 'DUPLICATE_GUEST' using errcode = 'P0001';
    end if;
    v_seen := v_seen || v_guest.id;

    v_status := case when p_status = 'declined' then 'declined' else v_item->>'status' end;
    if v_status not in ('attending', 'declined') then
      raise exception 'INVALID_STATUS' using errcode = 'P0001';
    end if;

    v_name := v_guest.full_name;
    v_cphone := v_guest.phone;
    if v_status = 'attending' then
      -- Quem vai precisa confirmar nome completo e telefone.
      v_name := btrim(coalesce(v_item->>'full_name', ''));
      v_cphone := coalesce(v_item->>'phone', '');
      if char_length(v_name) < 5 or char_length(v_name) > 120 or position(' ' in v_name) = 0 then
        raise exception 'INVALID_COMPANION_NAME' using errcode = 'P0001';
      end if;
      if v_cphone !~ '^[0-9]{10,13}$' then
        raise exception 'INVALID_COMPANION_PHONE' using errcode = 'P0001';
      end if;
    end if;

    update wedding.guests
       set attendance_status = v_status, responded_at = now(), full_name = v_name, phone = v_cphone
     where id = v_guest.id;
  end loop;

  select count(*) into v_total from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion';
  if coalesce(array_length(v_seen, 1), 0) <> v_total then
    raise exception 'MISSING_RESPONSES' using errcode = 'P0001';
  end if;

  update wedding.invitations
     set companions_declined = false,
         sent_at = coalesce(sent_at, now()),
         contact_email = nullif(btrim(coalesce(p_email, '')), ''),
         guest_message = nullif(btrim(coalesce(p_message, '')), '')
   where id = v_inv.id;

  insert into wedding.rsvp_events (invitation_id, event_type, details)
  values (
    v_inv.id,
    case when v_already then 'rsvp_updated' else 'rsvp_submitted' end,
    jsonb_build_object(
      'status', p_status,
      'companions_attending', (select count(*) from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion' and attendance_status = 'attending'),
      'companions_declined', (select count(*) from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion' and attendance_status = 'declined')
    )
  )
  returning id into v_event_id;

  return jsonb_build_object('event_id', v_event_id, 'updated', v_already);
end $$;

alter table wedding.tags enable row level security;
alter table wedding.settings enable row level security;
revoke all on all tables in schema wedding from public;
revoke all on all functions in schema wedding from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema wedding from %I', r);
      execute format('revoke all on all functions in schema wedding from %I', r);
    end if;
  end loop;
end $$;
