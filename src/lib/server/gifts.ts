import 'server-only';
import { z } from 'zod';
import catalog from '@/data/presentes.json';

/**
 * Lista de presentes: catálogo único usado pela página /presentes e pelo servidor.
 * O valor de qualquer pagamento é sempre recalculado aqui, a partir dos ids do carrinho.
 */
export type GiftProduct = { id: string; cat: string; name: string; price: number; img: string };
export const GIFT_PRODUCTS = catalog as GiftProduct[];
const byId = new Map(GIFT_PRODUCTS.map((p) => [p.id, p]));

export const FREE_MIN = 10;
export const FREE_MAX = 20000;

export const cartSchema = z.object({
  items: z.array(z.object({ id: z.string().max(60), qty: z.number().int().min(1).max(20) })).max(60).default([]),
  free: z.array(z.number().min(FREE_MIN).max(FREE_MAX)).max(10).default([]),
});
export type CartInput = z.infer<typeof cartSchema>;

export type PricedLine = { id: string; name: string; price: number; qty: number };

/** Confere o carrinho e calcula o total a partir dos preços do catálogo. */
export function priceCart(cart: CartInput): { lines: PricedLine[]; total: number } | { error: string } {
  const lines: PricedLine[] = [];
  for (const it of cart.items) {
    const p = byId.get(it.id);
    if (!p) return { error: 'Um dos presentes do carrinho não está mais na lista. Atualize a página e tente de novo.' };
    lines.push({ id: p.id, name: p.name, price: p.price, qty: it.qty });
  }
  cart.free.forEach((v, i) => lines.push({ id: `livre-${i + 1}`, name: 'Presente de valor livre', price: Math.round(v * 100) / 100, qty: 1 }));
  if (lines.length === 0) return { error: 'O carrinho está vazio.' };
  const total = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
  if (total <= 0 || total > 100000) return { error: 'Valor inválido.' };
  return { lines, total };
}

// ---------------------------------------------------------------------------
// Mercado Pago
// ---------------------------------------------------------------------------
export function mpConfigured() {
  return !!process.env.MP_ACCESS_TOKEN && !!process.env.MP_PUBLIC_KEY;
}

export function mpPublicKey() {
  return process.env.MP_PUBLIC_KEY ?? '';
}

type MpPayment = {
  id: number;
  status: string;
  status_detail: string;
  installments: number;
  transaction_amount: number;
  external_reference: string | null;
  transaction_details?: { total_paid_amount?: number };
};

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado.');
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.idempotencyKey ? { 'X-Idempotency-Key': init.idempotencyKey } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function createCardPayment(input: {
  orderId: string;
  amount: number;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string | number | null;
  payerEmail: string;
  payerDocType?: string;
  payerDocNumber?: string;
  notificationUrl?: string;
}) {
  return mp<MpPayment & { message?: string; cause?: { code: number; description: string }[] }>('/v1/payments', {
    method: 'POST',
    idempotencyKey: input.orderId,
    body: JSON.stringify({
      transaction_amount: input.amount,
      token: input.token,
      description: 'Lista de presentes · Fernanda & Giullia',
      installments: input.installments,
      payment_method_id: input.paymentMethodId,
      ...(input.issuerId ? { issuer_id: Number(input.issuerId) } : {}),
      payer: {
        email: input.payerEmail,
        ...(input.payerDocNumber ? { identification: { type: input.payerDocType || 'CPF', number: input.payerDocNumber } } : {}),
      },
      external_reference: input.orderId,
      statement_descriptor: 'FERNANDAEGIULLIA',
      ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
    }),
  });
}

export async function getPayment(id: string) {
  return mp<MpPayment>(`/v1/payments/${encodeURIComponent(id)}`);
}

/** Mensagens amigáveis para os motivos de recusa mais comuns. */
export function rejectionMessage(detail: string): string {
  const m: Record<string, string> = {
    cc_rejected_insufficient_amount: 'O cartão não tem limite suficiente.',
    cc_rejected_bad_filled_security_code: 'O código de segurança está incorreto.',
    cc_rejected_bad_filled_date: 'A data de validade está incorreta.',
    cc_rejected_bad_filled_card_number: 'O número do cartão está incorreto.',
    cc_rejected_bad_filled_other: 'Confira os dados do cartão.',
    cc_rejected_call_for_authorize: 'O banco pediu autorização. Ligue para o seu banco e tente de novo.',
    cc_rejected_card_disabled: 'O cartão está bloqueado. Ligue para o seu banco para ativá-lo.',
    cc_rejected_duplicated_payment: 'Você já fez um pagamento com esse valor. Se precisar pagar de novo, use outro cartão.',
    cc_rejected_high_risk: 'O pagamento foi recusado por segurança. Tente outro cartão ou o Pix.',
    cc_rejected_max_attempts: 'Você chegou ao limite de tentativas. Use outro cartão ou o Pix.',
  };
  return m[detail] ?? 'O pagamento não foi aprovado. Tente outro cartão ou pague com Pix.';
}
