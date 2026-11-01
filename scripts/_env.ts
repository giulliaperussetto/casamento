import postgres from 'postgres';

export function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      process.loadEnvFile(f);
    } catch {}
  }
}

export function connect() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Defina DATABASE_URL no arquivo .env');
  return postgres(url, { max: 1, prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', onnotice: () => {} });
}
