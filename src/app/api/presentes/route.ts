import { z } from 'zod';
import { db } from '@/lib/server/db';
import { json, sameOrigin } from '@/lib/server/http';
import { clientKey, hitRateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Registra um presente informado na página /presentes ("Já fiz o Pix").
 * Independente da confirmação de presença.
 */
const schema = z.object({
  name: z.string().trim().min(1, 'Escreva seu nome.').max(80),
  message: z.string().trim().max(500).optional().default(''),
  total: z.number().positive().max(100000),
  items: z
    .array(
      z.object({
        id: z.string().max(60),
        name: z.string().trim().min(1).max(160),
        price: z.number().positive().max(100000),
        qty: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(60),
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

  const { name, message, items } = parsed.data;
  // O total é recalculado no servidor a partir dos itens.
  const total = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  if (total <= 0 || total > 100000) return json({ error: 'Valor inválido.' }, 400);

  const sql = db();
  await sql`
    insert into wedding.gift_orders (giver_name, message, items, total)
    values (${name}, ${message || null}, ${sql.json(items)}, ${total})`;
  return json({ ok: true });
}
