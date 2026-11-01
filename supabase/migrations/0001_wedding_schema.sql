-- =====================================================================
-- Casamento — esquema do RSVP e do painel administrativo
-- Compatível com Supabase / PostgreSQL 14+
--
-- Todas as tabelas ficam no schema privado "wedding", que NÃO é exposto
-- pela API pública (PostgREST) do Supabase. O acesso acontece apenas pelo
-- servidor da aplicação, por meio de DATABASE_URL.
-- =====================================================================

create schema if not exists wedding;

-- ---------------------------------------------------------------------
-- Convites
-- ---------------------------------------------------------------------
create table if not exists wedding.invitations (
  id                       uuid primary key default gen_random_uuid(),
  code_hash                text not null unique,          -- HMAC-SHA256 do código normalizado
  code_encrypted           text,                          -- código cifrado (AES-256-GCM) para exibição no painel
  label                    text,                          -- observação interna (ex.: "Família Souza")
  invitation_type          text not null check (invitation_type in ('individual', 'couple')),
  primary_guest_id         uuid,
  max_guests               smallint not null,
  allow_unnamed_companion  boolean not null default false,
  active                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint invitations_capacity_by_type check (
    (invitation_type = 'individual' and max_guests = 1 and allow_unnamed_companion = false)
    or (invitation_type = 'couple' and max_guests = 2)
  )
);

-- ---------------------------------------------------------------------
-- Convidados (cada participante tem sua própria resposta)
-- ---------------------------------------------------------------------
create table if not exists wedding.guests (
  id                 uuid primary key default gen_random_uuid(),
  invitation_id      uuid not null references wedding.invitations(id) on delete cascade,
  full_name          text not null check (char_length(btrim(full_name)) between 2 and 120),
  guest_role         text not null check (guest_role in ('primary', 'companion')),
  name_locked        boolean not null default true,       -- nomes cadastrados pelo casal são imutáveis para o convidado
  attendance_status  text not null default 'pending' check (attendance_status in ('pending', 'attending', 'declined')),
  responded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Um único convidado principal e no máximo um acompanhante por convite.
create unique index if not exists guests_one_primary_per_invitation
  on wedding.guests (invitation_id) where guest_role = 'primary';
create unique index if not exists guests_one_companion_per_invitation
  on wedding.guests (invitation_id) where guest_role = 'companion';
create index if not exists guests_status_idx on wedding.guests (attendance_status);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invitations_primary_guest_fk') then
    alter table wedding.invitations
      add constraint invitations_primary_guest_fk
      foreign key (primary_guest_id) references wedding.guests(id)
      on delete set null deferrable initially deferred;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Histórico de eventos do RSVP (auditoria, sem dados pessoais sensíveis)
-- ---------------------------------------------------------------------
create table if not exists wedding.rsvp_events (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references wedding.invitations(id) on delete cascade,
  event_type     text not null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists rsvp_events_invitation_idx on wedding.rsvp_events (invitation_id, created_at desc);

-- ---------------------------------------------------------------------
-- Administração
-- ---------------------------------------------------------------------
create table if not exists wedding.admin_users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  password_hash  text not null,
  created_at     timestamptz not null default now()
);

create table if not exists wedding.admin_sessions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references wedding.admin_users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists admin_sessions_expires_idx on wedding.admin_sessions (expires_at);

-- ---------------------------------------------------------------------
-- Limites de requisição (persistentes, funcionam com múltiplas instâncias)
-- ---------------------------------------------------------------------
create table if not exists wedding.rate_limits (
  key           text primary key,
  count         integer not null,
  window_start  timestamptz not null
);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function wedding.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists invitations_touch on wedding.invitations;
create trigger invitations_touch before update on wedding.invitations
  for each row execute function wedding.touch_updated_at();
drop trigger if exists guests_touch on wedding.guests;
create trigger guests_touch before update on wedding.guests
  for each row execute function wedding.touch_updated_at();

-- ---------------------------------------------------------------------
-- Capacidade: o banco é a fonte final da verdade.
-- Bloqueia a linha do convite para serializar inserções concorrentes.
-- ---------------------------------------------------------------------
create or replace function wedding.enforce_guest_capacity() returns trigger
language plpgsql as $$
declare
  v_inv     wedding.invitations%rowtype;
  v_count   integer;
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

  if new.guest_role = 'companion' and v_inv.invitation_type <> 'couple' then
    raise exception 'COMPANION_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  return new;
end $$;

drop trigger if exists guests_capacity on wedding.guests;
create trigger guests_capacity before insert or update of invitation_id on wedding.guests
  for each row execute function wedding.enforce_guest_capacity();

-- Impede reduzir max_guests abaixo do número de convidados existentes.
create or replace function wedding.enforce_invitation_capacity() returns trigger
language plpgsql as $$
declare v_count integer;
begin
  select count(*) into v_count from wedding.guests where invitation_id = new.id;
  if v_count > new.max_guests then
    raise exception 'CAPACITY_EXCEEDED' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists invitations_capacity on wedding.invitations;
create trigger invitations_capacity before update of max_guests, invitation_type on wedding.invitations
  for each row execute function wedding.enforce_invitation_capacity();

-- ---------------------------------------------------------------------
-- Limite de requisições atômico. Retorna true se a requisição é permitida.
-- ---------------------------------------------------------------------
create or replace function wedding.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql as $$
declare v_count integer;
begin
  insert into wedding.rate_limits as rl (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.count + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end $$;

-- ---------------------------------------------------------------------
-- Registro transacional do RSVP.
--
-- p_responses: [{ "guest_id": uuid, "status": "attending"|"declined", "full_name"?: text }]
-- p_companion: null ou { "full_name": text, "status": "attending"|"declined" }
--   (somente quando o convite permite acompanhante sem nome e ainda não há acompanhante)
-- p_allow_changes: se false, convites já respondidos não podem ser alterados.
-- ---------------------------------------------------------------------
create or replace function wedding.submit_rsvp(
  p_invitation_id  uuid,
  p_responses      jsonb,
  p_companion      jsonb,
  p_allow_changes  boolean
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

-- ---------------------------------------------------------------------
-- Segurança: nada deste schema é acessível pelas chaves públicas do Supabase.
-- ---------------------------------------------------------------------
alter table wedding.invitations    enable row level security;
alter table wedding.guests         enable row level security;
alter table wedding.rsvp_events    enable row level security;
alter table wedding.admin_users    enable row level security;
alter table wedding.admin_sessions enable row level security;
alter table wedding.rate_limits    enable row level security;

revoke all on schema wedding from public;
revoke all on all tables in schema wedding from public;
revoke all on all functions in schema wedding from public;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema wedding from %I', r);
      execute format('revoke all on all tables in schema wedding from %I', r);
      execute format('revoke all on all functions in schema wedding from %I', r);
    end if;
  end loop;
end $$;
