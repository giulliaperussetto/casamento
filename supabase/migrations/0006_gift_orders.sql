-- =====================================================================
-- 0006 — Presentes informados pela página /presentes
--
-- Cada vez que alguém clica em "Já fiz o Pix", registramos o nome, o
-- recado e os itens. O pagamento vai direto para a conta das noivas;
-- aqui fica só o aviso, que as noivas conferem no extrato.
-- Nada disso tem relação com a confirmação de presença.
-- =====================================================================

create table if not exists wedding.gift_orders (
  id           uuid primary key default gen_random_uuid(),
  giver_name   text not null check (char_length(btrim(giver_name)) between 1 and 80),
  message      text check (message is null or char_length(message) <= 500),
  items        jsonb not null default '[]'::jsonb,
  total        numeric(10, 2) not null check (total > 0 and total <= 100000),
  method       text not null default 'pix' check (method in ('pix')),
  received     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists gift_orders_created_idx on wedding.gift_orders (created_at desc);

alter table wedding.gift_orders enable row level security;
revoke all on wedding.gift_orders from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on wedding.gift_orders from %I', r);
    end if;
  end loop;
end $$;
