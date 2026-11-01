/** Aplica as migrações SQL em supabase/migrations (idempotentes). */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect } from './_env';

const sql = connect();
const dir = join(process.cwd(), 'supabase/migrations');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  process.stdout.write(`→ ${file} … `);
  await sql.unsafe(readFileSync(join(dir, file), 'utf8'));
  console.log('ok');
}
await sql.end();
