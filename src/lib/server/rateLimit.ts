import 'server-only';
import { headers } from 'next/headers';
import { db } from './db';
import { hashIdentifier } from './crypto';

export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('cf-connecting-ip') ||
    'unknown';
  // O IP nunca é armazenado em texto puro.
  return hashIdentifier(ip);
}

/** Registra uma tentativa e retorna true se ainda está dentro do limite. */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const sql = db();
  const [row] = await sql<{ allowed: boolean }[]>`
    select wedding.hit_rate_limit(${key}, ${limit}, ${windowSeconds}) as allowed`;
  return row.allowed;
}

/** Consulta sem registrar tentativa. */
export async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const sql = db();
  const [row] = await sql<{ count: number }[]>`
    select count from wedding.rate_limits
    where key = ${key} and window_start >= now() - make_interval(secs => ${windowSeconds})`;
  return !!row && row.count >= limit;
}
