/**
 * Cria (ou redefine a senha de) um administrador.
 * Uso: npm run admin:create -- email@exemplo.com
 * A senha é solicitada no terminal (ou via variável ADMIN_PASSWORD).
 */
import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../src/lib/server/crypto';
import { connect } from './_env';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Uso: npm run admin:create -- email@exemplo.com');
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD ?? '';
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Senha (mínimo 12 caracteres): ');
  rl.close();
}
if (password.length < 12) {
  console.error('A senha precisa ter pelo menos 12 caracteres.');
  process.exit(1);
}

const sql = connect();
await sql`
  insert into wedding.admin_users (email, password_hash) values (${email}, ${await hashPassword(password)})
  on conflict (email) do update set password_hash = excluded.password_hash`;
await sql`delete from wedding.admin_sessions where admin_id = (select id from wedding.admin_users where email = ${email})`;
console.log(`Administrador ${email} pronto.`);
await sql.end();
