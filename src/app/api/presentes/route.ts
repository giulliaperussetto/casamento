import { z } from 'zod';
import { db } from '@/lib/server/db';
import { json, sameOrigin } from '@/lib/server/http';
import { clientKey, hitRateLimit } from '@/lib/server/rateLimit';
import { cartSchema, priceCart } from '@/lib/server/gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pix: registra o presente quando a pessoa clica em "Já fiz o Pix".
 * O dinheiro vai direto para a conta das noivas; aqui fica só o aviso.
 */
const schema = z.object({
  name: z.string().trim().min(1, 'Escreva seu nome.').max(80),
  message: z.string().trim().max(500).optional().default(''),
  cart: cartSchema,
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Não conseguimos registrar. Confira seu nome e o carrinho.' }, 400);

  const ip = await clientKey();
  if (!(await hitRateLimit(`gifts:${ip}`, 15, 60 * 60))) {
    return json({ error: 'Muitos envios em pouco tempo. Tente de novo mais tarde.' }, 429);
  }
  const priced = priceCart(parsed.data.cart);
  if ('error' in priced) return json({ error: priced.error }, 400);

  const sql = db();
  await sql`
    insert into wedding.gift_orders (giver_name, message, items, total, method, status)
    values (${parsed.data.name}, ${parsed.data.message || null}, ${sql.json(priced.lines)}, ${priced.total}, 'pix', 'informed')`;
  return json({ ok: true, total: priced.total });
}
