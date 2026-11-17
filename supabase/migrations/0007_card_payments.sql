-- =====================================================================
-- 0007 — Pagamentos com cartão pelo Mercado Pago na lista de presentes
--
-- Pix: continua direto na conta das noivas (status "informed" até as
--      noivas conferirem no extrato).
-- Cartão: cobrado pelo Mercado Pago. O status vem do próprio Mercado Pago
--      (approved, in_process, rejected...). Aprovado = marcado como pago.
-- Nada disso tem relação com a confirmação de presença.
-- =====================================================================

alter table wedding.gift_orders drop constraint if exists gift_orders_method_check;
alter table wedding.gift_orders add constraint gift_orders_method_check check (method in ('pix', 'card'));

alter table wedding.gift_orders
  add column if not exists status          text not null default 'informed',
  add column if not exists mp_payment_id   text,
  add column if not exists mp_status_detail text,
  add column if not exists installments    integer,
  add column if not exists paid_amount     numeric(10, 2),
  add column if not exists updated_at      timestamptz not null default now();

create unique index if not exists gift_orders_mp_payment_unique on wedding.gift_orders (mp_payment_id) where mp_payment_id is not null;
create index if not exists gift_orders_status_idx on wedding.gift_orders (status);
