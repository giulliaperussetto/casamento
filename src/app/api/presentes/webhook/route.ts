import { db } from '@/lib/server/db';
import { getPayment } from '@/lib/server/gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Notificações do Mercado Pago (ex.: pagamento "em análise" que depois foi aprovado).
 * Não confiamos no conteúdo recebido: buscamos o pagamento direto na API com o nosso token.
 */
async function handle(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const id = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if (type !== 'payment' || !/^\d{1,20}$/.test(id)) return new Response('ok');

  const res = await getPayment(id);
  const pay = res.data;
  if (!res.ok || !pay?.external_reference) return new Response('ok');

  await db()`
    update wedding.gift_orders
       set status = ${pay.status}, mp_payment_id = ${String(pay.id)}, mp_status_detail = ${pay.status_detail},
           installments = ${pay.installments}, paid_amount = ${pay.transaction_details?.total_paid_amount ?? null},
           received = ${pay.status === 'approved'}, updated_at = now()
     where id::text = ${pay.external_reference} and method = 'card'`;
  return new Response('ok');
}

export const POST = handle;
export const GET = handle;
