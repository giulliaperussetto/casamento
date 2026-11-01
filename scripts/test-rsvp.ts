/**
 * Teste de ponta a ponta das regras do RSVP contra o servidor em execução.
 * Uso: BASE_URL=http://localhost:3000 npm run test:rsvp
 * Cria convites temporários (identificados como "TESTE-AUTO") e remove ao final.
 */
import { randomUUID } from 'node:crypto';
import { encryptInviteCode, generateInviteCode, hashInviteCode } from '../src/lib/server/crypto';
import { connect } from './_env';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const sql = connect();
let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`, extra ?? '');
  }
}

const ip = () => `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

async function api(path: string, body: any, fromIp = ip()) {
  if (path.endsWith('/submit') && body && !('email' in body)) body = { ...body, email: 'convidado@example.com' };
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fromIp },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json()) as any };
}

async function invite(type: 'individual' | 'couple', primary: string, companion?: string, allowUnnamed = false, active = true) {
  const code = generateInviteCode();
  const [inv] = await sql<{ id: string }[]>`
    insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion, active)
    values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, 'TESTE-AUTO', ${type}, ${type === 'couple' ? 2 : 1}, ${allowUnnamed}, ${active})
    returning id`;
  const [g] = await sql<{ id: string }[]>`insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${primary}, 'primary') returning id`;
  await sql`update wedding.invitations set primary_guest_id = ${g.id} where id = ${inv.id}`;
  if (companion) await sql`insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${companion}, 'companion')`;
  return { id: inv.id, code };
}

try {
  console.log('Código inválido');
  let r = await api('/api/rsvp/verify', { code: 'CASA-ZZZZZ-ZZZZZ' });
  check('retorna 404 com mensagem amigável', r.status === 404 && /Não encontramos/.test(r.data.error), r);

  console.log('Convite individual');
  const ind = await invite('individual', 'Mariana Oliveira');
  r = await api('/api/rsvp/verify', { code: ind.code.toLowerCase().replace(/-/g, ' ') });
  check('valida código (sem diferenciar maiúsculas/hífens)', r.status === 200, r);
  const indInv = r.data.invitation;
  check('exibe 1 participante com nome cadastrado', indInv.guests.length === 1 && indInv.guests[0].fullName === 'Mariana Oliveira');
  check('não permite acompanhante', indInv.canAddCompanion === false);
  check('não expõe ids internos do convite', !('id' in indInv) && !JSON.stringify(indInv).includes(ind.id));
  r = await api('/api/rsvp/submit', {
    code: ind.code,
    responses: [{ guestId: indInv.guests[0].id, status: 'attending' }],
    companion: { fullName: 'Intruso da Silva', status: 'attending' },
  });
  check('rejeita acompanhante em convite individual', r.status === 409, r);
  r = await api('/api/rsvp/submit', {
    code: ind.code,
    responses: [{ guestId: indInv.guests[0].id, status: 'attending', fullName: 'Outro Nome' }],
  });
  check('nome cadastrado é imutável', r.status === 409 && /não podem ser alterados/.test(r.data.error), r);
  r = await api('/api/rsvp/submit', { code: ind.code, responses: [{ guestId: indInv.guests[0].id, status: 'attending' }] });
  check('salva confirmação', r.status === 200 && r.data.eventId, r);
  const [contact] = await sql`select contact_email from wedding.invitations where id = ${ind.id}`;
  check('salva e-mail de contato', contact.contact_email === 'convidado@example.com');
  r = await api('/api/rsvp/submit', { code: ind.code, email: 'invalido', responses: [{ guestId: indInv.guests[0].id, status: 'attending' }] });
  check('rejeita e-mail inválido', r.status === 400, r);
  const [row] = await sql`select attendance_status, responded_at from wedding.guests where invitation_id = ${ind.id}`;
  check('resposta persistida no banco', row.attendance_status === 'attending' && row.responded_at);
  r = await api('/api/rsvp/submit', { code: ind.code, responses: [{ guestId: indInv.guests[0].id, status: 'declined' }] });
  const [cnt] = await sql`select count(*)::int as n from wedding.guests where invitation_id = ${ind.id}`;
  check('alteração atualiza o registro existente (sem duplicar)', r.status === 200 && r.data.updated === true && cnt.n === 1, r);

  console.log('Convite de casal com acompanhante cadastrado');
  const cpl = await invite('couple', 'Rafael Almeida', 'Juliana Prado');
  r = await api('/api/rsvp/verify', { code: cpl.code });
  const cplInv = r.data.invitation;
  check('exibe os 2 participantes', cplInv.guests.length === 2 && cplInv.guests[1].fullName === 'Juliana Prado');
  check('não oferece terceiro participante', cplInv.canAddCompanion === false);
  r = await api('/api/rsvp/submit', { code: cpl.code, responses: [{ guestId: cplInv.guests[0].id, status: 'attending' }] });
  check('exige resposta de cada participante', r.status === 409, r);
  r = await api('/api/rsvp/submit', {
    code: cpl.code,
    responses: [
      { guestId: cplInv.guests[0].id, status: 'attending' },
      { guestId: cplInv.guests[0].id, status: 'declined' },
    ],
  });
  check('rejeita resposta duplicada para o mesmo participante', r.status === 409, r);
  r = await api('/api/rsvp/submit', {
    code: cpl.code,
    responses: [
      { guestId: cplInv.guests[0].id, status: 'attending' },
      { guestId: cplInv.guests[1].id, status: 'declined' },
    ],
    companion: { fullName: 'Terceira Pessoa', status: 'attending' },
  });
  check('impede terceiro participante', r.status === 409, r);
  r = await api('/api/rsvp/submit', {
    code: cpl.code,
    responses: [
      { guestId: cplInv.guests[0].id, status: 'attending' },
      { guestId: cplInv.guests[1].id, status: 'declined' },
    ],
  });
  check('salva respostas individuais', r.status === 200 && r.data.invitation.guests[1].status === 'declined', r);

  console.log('Isolamento entre convites');
  r = await api('/api/rsvp/submit', { code: ind.code, responses: [{ guestId: cplInv.guests[0].id, status: 'declined' }] });
  check('não permite responder por convidado de outro convite', r.status === 409, r);
  r = await api('/api/rsvp/submit', { code: ind.code, responses: [{ guestId: randomUUID(), status: 'declined' }] });
  check('rejeita participante inexistente', r.status === 409, r);

  console.log('Casal com acompanhante a definir');
  const open = await invite('couple', 'Pedro Lima', undefined, true);
  r = await api('/api/rsvp/verify', { code: open.code });
  const openInv = r.data.invitation;
  check('permite informar acompanhante', openInv.canAddCompanion === true && openInv.guests.length === 1);
  // Envios simultâneos tentando criar acompanhantes diferentes
  const results = await Promise.all(
    ['Ana Souza', 'Bruna Costa', 'Carla Dias', 'Daniela Reis', 'Elisa Melo'].map((n) =>
      api('/api/rsvp/submit', {
        code: open.code,
        responses: [{ guestId: openInv.guests[0].id, status: 'attending' }],
        companion: { fullName: n, status: 'attending' },
      }),
    ),
  );
  const [companions] = await sql`select count(*)::int as n from wedding.guests where invitation_id = ${open.id}`;
  check('concorrência: apenas 1 acompanhante criado (máx. 2 pessoas)', companions.n === 2 && results.filter((x) => x.status === 200).length === 1, results.map((x) => x.status));
  r = await api('/api/rsvp/verify', { code: open.code });
  check('acompanhante não pode ser adicionado de novo', r.data.invitation.canAddCompanion === false);

  console.log('Convite inativo');
  const off = await invite('individual', 'Convidado Inativo', undefined, false, false);
  r = await api('/api/rsvp/verify', { code: off.code });
  check('rejeita convite inativo', r.status === 403, r);

  console.log('Proteção contra força bruta');
  const attacker = ip();
  let last = 0;
  for (let i = 0; i < 10; i++) last = (await api('/api/rsvp/verify', { code: generateInviteCode() }, attacker)).status;
  check('bloqueia após tentativas inválidas repetidas (429)', last === 429, last);
  r = await api('/api/rsvp/verify', { code: ind.code }, attacker);
  check('bloqueio vale mesmo com código correto', r.status === 429);

  console.log('Honeypot e origem');
  r = await api('/api/rsvp/submit', { code: ind.code, website: 'spam', responses: [] });
  check('honeypot rejeita robôs', r.status === 400);
  const cross = await fetch(BASE + '/api/rsvp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://site-malicioso.com', 'x-forwarded-for': ip() },
    body: JSON.stringify({ code: ind.code }),
  });
  check('rejeita requisições de outra origem', cross.status === 403);

  console.log('Painel administrativo');
  const adminRes = await fetch(BASE + '/admin', { redirect: 'manual' });
  check('/admin sem sessão redireciona para login', [302, 303, 307].includes(adminRes.status) && /\/admin\/login/.test(adminRes.headers.get('location') ?? ''), adminRes.status);
  const exp = await fetch(BASE + '/api/admin/export');
  check('exportação CSV exige autenticação', exp.status === 401);
  const fake = await fetch(BASE + '/api/admin/export', { headers: { Cookie: 'wedding_admin=forjado' } });
  check('cookie forjado é rejeitado', fake.status === 401);
} finally {
  await sql`delete from wedding.invitations where label = 'TESTE-AUTO'`;
  await sql`delete from wedding.rate_limits where key like 'rsvp:%'`;
  await sql.end();
}

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed ? 1 : 0);
