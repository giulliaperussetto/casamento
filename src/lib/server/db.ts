import 'server-only';
import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var __weddingSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada.');
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    // Necessário para o pooler em modo transação do Supabase (porta 6543)
    prepare: false,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
  });
}

export function db() {
  if (!globalThis.__weddingSql) globalThis.__weddingSql = createClient();
  return globalThis.__weddingSql;
}
