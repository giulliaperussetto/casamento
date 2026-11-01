/**
 * Limpa e normaliza a DATABASE_URL colada na Vercel:
 * remove espaços, aspas, quebras de linha e o prefixo "DATABASE_URL=",
 * tira colchetes em volta da senha e codifica caracteres especiais da senha.
 */
export function normalizeDatabaseUrl(raw: string): string {
  let url = raw.replace(/\s+/g, '');
  for (let i = 0; i < 3; i++) {
    url = url.replace(/^["'`]+|["'`]+$/g, '').replace(/^DATABASE_URL=/i, '');
  }
  const m = url.match(/^(postgres(?:ql)?:\/\/)([^:/@]+):(.*)@([^@/]+)(\/.*)?$/);
  if (!m) return url;
  const [, scheme, user, rawPass, host, rest = '/postgres'] = m;
  let pass = rawPass.replace(/^\[(.*)\]$/, '$1');
  try {
    pass = decodeURIComponent(pass);
  } catch {}
  return `${scheme}${user}:${encodeURIComponent(pass)}@${host}${rest}`;
}

export type UrlProblem = string;

/** Aponta problemas comuns no formato, sem revelar a senha. */
export function inspectDatabaseUrl(raw: string): UrlProblem[] {
  const problems: UrlProblem[] = [];
  const v = raw.trim();
  if (/YOUR-PASSWORD/i.test(v)) problems.push('Ainda há "[YOUR-PASSWORD]" no endereço. Troque pela senha do banco, sem colchetes.');
  const url = normalizeDatabaseUrl(raw);
  if (!/^postgres(ql)?:\/\//.test(url)) problems.push('O endereço deve começar com postgresql://');
  const m = url.match(/^postgres(?:ql)?:\/\/([^:/@]+):(.*)@([^@/:]+)(?::(\d+))?(\/.*)?$/);
  if (!m) {
    problems.push('Formato esperado: postgresql://postgres.ID-DO-PROJETO:SENHA@aws-...pooler.supabase.com:6543/postgres');
    return problems;
  }
  const [, user, pass, host, port] = m;
  if (!pass) problems.push('A senha está vazia (falta a senha entre ":" e "@").');
  if (host.includes('pooler.supabase.com') && !user.startsWith('postgres.')) {
    problems.push('Com o pooler, o usuário deve ser "postgres.ID-DO-PROJETO" (com ponto).');
  }
  if (host.includes('pooler.supabase.com') && port && port !== '6543' && port !== '5432') {
    problems.push(`Porta ${port} inesperada; use 6543 (Transaction pooler).`);
  }
  return problems;
}
