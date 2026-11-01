import 'server-only';
import postgres from 'postgres';

export type Check = { label: string; ok: boolean; detail?: string };

const REQUIRED = ['DATABASE_URL', 'INVITE_CODE_PEPPER', 'INVITE_CODE_ENCRYPTION_KEY', 'RATE_LIMIT_SECRET'] as const;

/** Traduz erros de conexão em mensagens úteis, sem expor dados sensíveis. */
export function explainDbError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const msg = e.message ?? '';
  if (e.code === '28P01' || /password authentication failed/i.test(msg)) {
    return 'Senha do banco incorreta. Confira a senha dentro da DATABASE_URL (sem colchetes).';
  }
  if (/Tenant or user not found/i.test(msg)) {
    return 'Usuário ou projeto incorreto no endereço. O usuário deve ser "postgres.ID-DO-PROJETO".';
  }
  if (e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN') return 'Endereço (host) do banco inválido na DATABASE_URL.';
  if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
    return 'Não foi possível conectar. Confira se usou o "Transaction pooler" (porta 6543) e se o projeto do Supabase não está pausado.';
  }
  if (e.code === '3D000') return 'O nome do banco no final do endereço deve ser "postgres".';
  if (/Invalid URL|invalid connection|ERR_INVALID_URL/i.test(msg)) {
    return 'A DATABASE_URL está mal formatada. Se a senha tiver caracteres especiais (@ # / ? %), gere outra só com letras e números.';
  }
  return `Erro ao conectar (${e.code ?? 'desconhecido'}).`;
}

export async function runDiagnostics(): Promise<Check[]> {
  const checks: Check[] = [];
  for (const name of REQUIRED) {
    const value = process.env[name];
    checks.push({ label: `Variável ${name} configurada na Vercel`, ok: !!value && value.trim().length > 0 });
  }
  const key = process.env.INVITE_CODE_ENCRYPTION_KEY;
  if (key) {
    const len = Buffer.from(key, 'base64').length;
    checks.push({ label: 'INVITE_CODE_ENCRYPTION_KEY com 32 bytes', ok: len === 32, detail: len === 32 ? undefined : 'Copie o valor exatamente como está no arquivo, sem espaços.' });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return checks;

  let sql: ReturnType<typeof postgres> | null = null;
  try {
    sql = postgres(url, { max: 1, prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', connect_timeout: 10, idle_timeout: 2 });
    await sql`select 1`;
    checks.push({ label: 'Conexão com o banco (Supabase)', ok: true });
  } catch (err) {
    checks.push({ label: 'Conexão com o banco (Supabase)', ok: false, detail: explainDbError(err) });
    await sql?.end({ timeout: 1 }).catch(() => {});
    return checks;
  }

  try {
    const [r] = await sql<{ t1: boolean; t2: boolean; t3: boolean; admins: number }[]>`
      select to_regclass('wedding.invitations') is not null as t1,
             exists (select 1 from information_schema.columns where table_schema = 'wedding' and table_name = 'invitations' and column_name = 'contact_email') as t2,
             exists (select 1 from pg_proc where proname = 'submit_rsvp_v3') as t3,
             0 as admins`;
    checks.push({ label: 'Arquivo 0001 rodado (tabelas criadas)', ok: r.t1, detail: r.t1 ? undefined : 'Rode o 0001_wedding_schema.sql no SQL Editor.' });
    checks.push({ label: 'Arquivo 0002 rodado', ok: r.t2, detail: r.t2 ? undefined : 'Rode o 0002_contact_and_message.sql no SQL Editor.' });
    checks.push({ label: 'Arquivo 0003 rodado', ok: r.t3, detail: r.t3 ? undefined : 'Rode o 0003_companion_slots.sql no SQL Editor.' });
    if (r.t1) {
      const [a] = await sql<{ n: number }[]>`select count(*)::int as n from wedding.admin_users`;
      checks.push({ label: 'Login do painel criado', ok: a.n > 0, detail: a.n > 0 ? undefined : 'Rode o trecho do item 3 do PASSO-A-PASSO-PRIVADO.txt no SQL Editor.' });
    }
  } catch (err) {
    checks.push({ label: 'Leitura das tabelas', ok: false, detail: explainDbError(err) });
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
  return checks;
}
