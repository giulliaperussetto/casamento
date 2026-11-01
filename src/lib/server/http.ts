import 'server-only';
import { NextResponse } from 'next/server';
import { RsvpError } from './rsvp';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function handleError(err: unknown) {
  if (err instanceof RsvpError) return json({ error: err.message, code: err.code }, err.status);
  console.error('[rsvp] erro inesperado', err);
  return json({ error: 'Não foi possível concluir agora. Tente novamente em instantes.' }, 500);
}

/** Proteção básica contra requisições de outras origens (CSRF). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
