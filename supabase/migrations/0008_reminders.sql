-- =====================================================================
-- 0008 — Lembretes pelo WhatsApp (enviados pelas noivas, um clique por
--        convite). Guarda quem já recebeu cada lembrete e quando.
--
-- Tipos:
--   prazo   → 1 dia antes de fechar a lista, para quem ainda não respondeu
--   semana  → 1 semana antes do casamento, para quem confirmou
--   vespera → 1 dia antes do casamento, para quem confirmou
-- =====================================================================

create table if not exists wedding.reminder_sends (
  invitation_id  uuid not null references wedding.invitations(id) on delete cascade,
  kind           text not null check (kind in ('prazo', 'semana', 'vespera')),
  sent_at        timestamptz not null default now(),
  primary key (invitation_id, kind)
);

alter table wedding.reminder_sends enable row level security;
revoke all on wedding.reminder_sends from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on wedding.reminder_sends from anon, authenticated';
  end if;
end $$;
