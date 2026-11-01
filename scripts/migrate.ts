/** Aplica as migrações SQL em supabase/migrations, cada uma apenas uma vez. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect } from './_env';

const sql = connect();
await sql`create schema if not exists wedding`;
await sql`create table if not exists wedding.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
await sql`revoke all on wedding.schema_migrations from public`;

// Bancos criados antes deste controle: marca as migrações já presentes.
const [{ has0001 }] = await sql`select to_regclass('wedding.invitations') is not null as has0001`;
const [{ has0002 }] = await sql`select exists (select 1 from information_schema.columns where table_schema = 'wedding' and table_name = 'invitations' and column_name = 'contact_email') as has0002`;
const [{ has0003 }] = await sql`select exists (select 1 from information_schema.columns where table_schema = 'wedding' and table_name = 'invitations' and column_name = 'companions_declined') as has0003`;
const legacy = [has0001 && '0001_wedding_schema.sql', has0002 && '0002_contact_and_message.sql', has0003 && '0003_companion_slots.sql'].filter(Boolean) as string[];
for (const name of legacy) await sql`insert into wedding.schema_migrations (name) values (${name}) on conflict do nothing`;

const applied = new Set((await sql<{ name: string }[]>`select name from wedding.schema_migrations`).map((r) => r.name));
const dir = join(process.cwd(), 'supabase/migrations');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) {
    console.log(`= ${file} (já aplicada)`);
    continue;
  }
  process.stdout.write(`→ ${file} … `);
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(join(dir, file), 'utf8'));
    await tx`insert into wedding.schema_migrations (name) values (${file})`;
  });
  console.log('ok');
}
await sql.end();
