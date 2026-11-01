import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';
import { randomToken, sha256, verifyPassword } from './crypto';
import { clientKey, hitRateLimit } from './rateLimit';

const COOKIE = 'wedding_admin';
const SESSION_HOURS = 12;

export type Admin = { id: string; email: string };

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.INSECURE_COOKIES !== 'true',
    sameSite: 'strict' as const,
    path: '/',
    expires,
  };
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await clientKey();
  const normalized = email.trim().toLowerCase();
  const ipOk = await hitRateLimit(`admin:login:${ip}`, 10, 15 * 60);
  const userOk = await hitRateLimit(`admin:login:user:${normalized}`, 10, 15 * 60);
  if (!ipOk || !userOk) return { ok: false, error: 'Muitas tentativas. Aguarde 15 minutos.' };

  const sql = db();
  const [user] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from wedding.admin_users where email = ${normalized}`;
  // Executa a verificação mesmo sem usuário para não revelar e-mails cadastrados pelo tempo de resposta.
  const valid = await verifyPassword(
    password,
    user?.password_hash ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  );
  if (!user || !valid) return { ok: false, error: 'E-mail ou senha incorretos.' };

  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  await sql`delete from wedding.admin_sessions where expires_at < now()`;
  await sql`insert into wedding.admin_sessions (admin_id, token_hash, expires_at)
            values (${user.id}, ${sha256(token)}, ${expires})`;
  (await cookies()).set(COOKIE, token, cookieOptions(expires));
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db()`delete from wedding.admin_sessions where token_hash = ${sha256(token)}`;
  store.delete(COOKIE);
}

/** Valida a sessão no servidor (uma vez por requisição). */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [row] = await db()<Admin[]>`
    select u.id, u.email from wedding.admin_sessions s
    join wedding.admin_users u on u.id = s.admin_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
  return row ?? null;
});

/** Use em toda página, ação e rota administrativa. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
