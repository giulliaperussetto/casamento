import { z } from 'zod';
import { verifyInvitation } from '@/lib/server/rsvp';
import { handleError, json, sameOrigin } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ code: z.string().min(1).max(64), website: z.string().max(0).optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Digite o código recebido no seu convite.' }, 400);
  try {
    return json({ invitation: await verifyInvitation(parsed.data.code) });
  } catch (err) {
    return handleError(err);
  }
}
