import { z } from 'zod';
import { db } from '@/lib/server/db';
import { json, sameOrigin } from '@/lib/server/http';
import { clientKey, hitRateLimit } from '@/lib/server/rateLimit';
import { cartSchema, createCardPayment, mpConfigured, priceCart, rejectionMessage } from '@/lib/server/gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cartão de crédito pelo Mercado Pago.
 * Os dados do cartão nunca passam por aqui: o formulário do Mercado Pago gera um "token"
 * e o servidor cobra o valor recalculado a partir do catálogo. Juros do parcelamento
 * são pagos pelo comprador (configuração padrão do Mercado Pago).
 */
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  message: z.string().trim().max(500).optional().default(''),
  cart: cartSchema,
  amount: z.number().positive(),
  payment: z.object({
    token: z.string().min(10).max(200),
    installments: z.number().int().min(1).max(12),
    payment_method_id: z.string().min(2).max(40),
    issuer_id: z.union([z.string(), z.number()]).optional().nullable(),
    payer: z.object({
      email: z.string().email().max(200),
      identification: z.object({ type: z.string().max(10), number: z.string().max(20) }).optional(),
    }),
  }),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403);
  if (!mpConfigured()) return json({ error: 'O pagamento com cartão ainda não está disponível. Use o Pix.' }, 503);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Confira os dados do pagamento e tente de novo.' }, 400);

  const ip = await clientKey();
  if (!(await hitRateLimit(`card:${ip}`, 10, 60 * 60))) {
    return json({ error: 'Muitas tentativas em pouco tempo. Tente de novo mais tarde ou use o Pix.' }, 429);
  }

  const priced = priceCart(parsed.data.cart);
  if ('error' in priced) return json({ error: priced.error }, 400);
  // O valor mostrado no formulário precisa ser o mesmo do carrinho conferido no servidor.
  if (Math.abs(priced.total - parsed.data.amount) > 0.009) {
    return json({ error: 'O valor do carrinho mudou. Atualize a página e tente de novo.' }, 409);
  }

  const sql = db();
  const [order] = await sql<{ id: string }[]>`
    insert into wedding.gift_orders (giver_name, message, items, total, method, status)
    values (${parsed.data.name}, ${parsed.data.message || null}, ${sql.json(priced.lines)}, ${priced.total}, 'card', 'processing')
    returning id`;

  const origin = new URL(req.url).origin;
  const p = parsed.data.payment;
  let result;
  try {
    result = await createCardPayment({
      orderId: order.id,
      amount: priced.total,
      token: p.token,
      installments: p.installments,
      paymentMethodId: p.payment_method_id,
      issuerId: p.issuer_id,
      payerEmail: p.payer.email,
      payerDocType: p.payer.identification?.type,
      payerDocNumber: p.payer.identification?.number?.replace(/\D/g, ''),
      notificationUrl: origin.startsWith('https://') ? `${origin}/api/presentes/webhook` : undefined,
    });
  } catch (err) {
    console.error('[presentes] falha ao chamar o Mercado Pago', err);
    await sql`update wedding.gift_orders set status = 'error', updated_at = now() where id = ${order.id}`;
    return json({ error: 'Não foi possível falar com o Mercado Pago agora. Tente de novo em instantes ou use o Pix.' }, 502);
  }

  const pay = result.data;
  if (!result.ok || !pay.id) {
    console.error('[presentes] Mercado Pago recusou a criação', result.status, JSON.stringify(pay).slice(0, 500));
    await sql`update wedding.gift_orders set status = 'error', mp_status_detail = ${String(pay.message ?? result.status)}, updated_at = now() where id = ${order.id}`;
    return json({ error: 'Não conseguimos processar o cartão. Confira os dados ou use o Pix.' }, 400);
  }

  await sql`
    update wedding.gift_orders
       set status = ${pay.status}, mp_payment_id = ${String(pay.id)}, mp_status_detail = ${pay.status_detail},
           installments = ${pay.installments}, paid_amount = ${pay.transaction_details?.total_paid_amount ?? null},
           received = ${pay.status === 'approved'}, updated_at = now()
     where id = ${order.id}`;

  if (pay.status === 'approved') return json({ status: 'approved', total: priced.total, installments: pay.installments });
  if (pay.status === 'in_process' || pay.status === 'pending') {
    return json({ status: 'in_process', total: priced.total, message: 'Seu pagamento está em análise. Assim que for aprovado, as noivas são avisadas.' });
  }
  return json({ status: 'rejected', error: rejectionMessage(pay.status_detail) }, 402);
}
