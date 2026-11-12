import { submitRsvp, submitSchema } from '@/lib/server/rsvp';
import { handleError, json, sameOrigin } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Origem não permitida.' }, 403);
  const body = await req.json().catch(() => null);
  if (body && typeof body.website === 'string' && body.website.length > 0) {
    return json({ error: 'Não foi possível concluir agora.' }, 400); // honeypot
  }
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? '');
    const error =
      issue?.message === 'INVALID_PHONE'
          ? 'Informe um telefone válido com DDD, por exemplo (11) 98765-4321.'
          : field === 'companions'
            ? 'Informe nome e sobrenome de cada acompanhante.'
            : 'Verifique as respostas antes de enviar.';
    return json({ error }, 400);
  }
  try {
    return json(await submitRsvp(parsed.data));
  } catch (err) {
    return handleError(err);
  }
}
