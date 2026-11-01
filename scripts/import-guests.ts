/**
 * Importa a lista real de convidados a partir de um CSV (separador ; ou ,).
 *
 * Colunas (com cabeçalho):
 *   convidado;acompanhantes;identificacao
 *   Mariana Oliveira;0;Amigas da faculdade
 *   Rafael Almeida;1;Família Almeida
 *   Pedro Lima;3;Trabalho
 *
 * "acompanhantes" é o número de vagas de acompanhante (0 = individual).
 * O convidado informa nome e telefone de cada acompanhante ao confirmar.
 *
 * Gera um código único para cada convite e grava um CSV de saída com os códigos
 * (guarde-o em local seguro — os códigos ficam no banco apenas como hash + cifrados).
 *
 * Uso: npm run guests:import -- convidados.csv [saida.csv]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { encryptInviteCode, generateInviteCode, hashInviteCode } from '../src/lib/server/crypto';
import { connect } from './_env';

const [input, output = 'convites-gerados.csv'] = process.argv.slice(2);
if (!input) {
  console.error('Uso: npm run guests:import -- convidados.csv [saida.csv]');
  process.exit(1);
}

const text = readFileSync(input, 'utf8').replace(/^﻿/, '');
const lines = text.split(/\r?\n/).filter((l) => l.trim());
const sep = lines[0].includes(';') ? ';' : ',';
const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
const col = (row: string[], name: string) => (row[header.indexOf(name)] ?? '').trim();

const sql = connect();
const out = ['identificacao;convidado;vagas_acompanhante;codigo'];
let count = 0;

await sql.begin(async (tx) => {
  for (const [i, line] of lines.slice(1).entries()) {
    const row = line.split(sep);
    const primary = col(row, 'convidado');
    const slots = Number(col(row, 'acompanhantes') || '0');
    const label = col(row, 'identificacao') || null;
    if (primary.length < 2) throw new Error(`Linha ${i + 2}: nome do convidado inválido.`);
    if (!Number.isInteger(slots) || slots < 0 || slots > 20) throw new Error(`Linha ${i + 2}: número de acompanhantes inválido.`);

    const code = generateInviteCode();
    const [inv] = await tx<{ id: string }[]>`
      insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion)
      values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, ${label}, ${slots > 0 ? 'group' : 'individual'}, ${1 + slots}, ${slots > 0})
      returning id`;
    const [g] = await tx<{ id: string }[]>`
      insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${primary}, 'primary') returning id`;
    await tx`update wedding.invitations set primary_guest_id = ${g.id} where id = ${inv.id}`;
    await tx`insert into wedding.rsvp_events (invitation_id, event_type) values (${inv.id}, 'invitation_imported')`;
    out.push([label ?? '', primary, slots, code].join(';'));
    count++;
  }
});

writeFileSync(output, '﻿' + out.join('\r\n'));
console.log(`${count} convites importados. Códigos salvos em ${output}.`);
await sql.end();
