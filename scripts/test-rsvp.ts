/**
 * Teste de ponta a ponta das regras do RSVP contra o servidor em execução.
 * Uso: BASE_URL=http://localhost:3000 npm run test:rsvp
 * Cria convites temporários (identificados como "TESTE-AUTO") e remove ao final.
 */
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
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fromIp },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json()) as any };
}

async function invite(primary: string, companions: string[] = [], active = true) {
  const code = generateInviteCode();
  const [inv] = await sql<{ id: string }[]>`
    insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion, active)
    values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, 'TESTE-AUTO', ${companions.length ? 'group' : 'individual'}, ${1 + companions.length}, false, ${active})
    returning id`;
  const [g] = await sql<{ id: string }[]>`insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${primary}, 'primary') returning id`;
  await sql`update wedding.invitations set primary_guest_id = ${g.id} where id = ${inv.id}`;
  for (const n of companions) await sql`insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${n}, 'companion')`;
  return { id: inv.id, code };
}

const base = { email: 'convidado@example.com', phone: '(11) 98765-4321' };
const submit = (code: string, extra: any, fromIp?: string) => api('/api/rsvp/submit', { code, ...base, ...extra }, fromIp);
const guestsOf = (id: string) => sql`select full_name, guest_role, attendance_status, phone from wedding.guests where invitation_id = ${id} order by guest_role desc, created_at`;

try {
  console.log('Código inválido');
  let r = await api('/api/rsvp/verify', { code: 'CASA-ZZZZZ-ZZZZZ' });
  check('retorna 404 com mensagem amigável', r.status === 404 && /Não encontramos/.test(r.data.error), r);

  console.log('Convite individual');
  const ind = await invite('Mariana Oliveira');
  r = await api('/api/rsvp/verify', { code: ind.code.toLowerCase().replace(/-/g, ' ') });
  check('valida código (sem diferenciar maiúsculas/hífens)', r.status === 200, r);
  check('exibe nome cadastrado e nenhum acompanhante', r.data.invitation.primaryName === 'Mariana Oliveira' && r.data.invitation.companions.length === 0);
  check('não expõe o id do convite', !JSON.stringify(r.data).includes(ind.id));
  r = await submit(ind.code, { status: 'attending', phone: '1234' });
  check('rejeita telefone inválido', r.status === 400 && /telefone/i.test(r.data.error), r);
  r = await submit(ind.code, { status: 'attending', email: 'invalido' });
  check('rejeita e-mail inválido', r.status === 400, r);
  r = await submit(ind.code, { status: 'attending' });
  check('salva confirmação', r.status === 200 && r.data.eventId, r);
  let rows = await guestsOf(ind.id);
  check('resposta e telefone persistidos (só dígitos)', rows[0].attendance_status === 'attending' && rows[0].phone === '11987654321', rows);
  r = await submit(ind.code, { status: 'declined' });
  rows = await guestsOf(ind.id);
  check('alteração atualiza o registro existente', r.status === 200 && r.data.updated === true && rows.length === 1 && rows[0].attendance_status === 'declined', r);

  console.log('Convite com 2 acompanhantes cadastrados');
  const grp = await invite('Rafael Almeida', ['Juliana Prado', 'Pedro Lima']);
  r = await api('/api/rsvp/verify', { code: grp.code });
  const comps = r.data.invitation.companions;
  check('exibe os acompanhantes com nome', comps.length === 2 && comps[0].fullName === 'Juliana Prado' && comps[1].fullName === 'Pedro Lima');
  r = await submit(grp.code, { status: 'attending', companions: [{ guestId: comps[0].id, status: 'attending' }] });
  check('exige resposta para cada acompanhante', r.status === 409, r);
  r = await submit(grp.code, {
    status: 'attending',
    companions: [
      { guestId: comps[0].id, status: 'attending' },
      { guestId: comps[0].id, status: 'declined' },
    ],
  });
  check('rejeita resposta duplicada', r.status === 409, r);
  r = await submit(grp.code, {
    status: 'attending',
    companions: [
      { guestId: comps[0].id, status: 'attending' },
      { guestId: comps[1].id, status: 'declined' },
    ],
  });
  rows = await guestsOf(grp.id);
  check('salva a resposta de cada acompanhante', r.status === 200 && rows.length === 3 && rows.find((x) => x.full_name === 'Juliana Prado')?.attendance_status === 'attending' && rows.find((x) => x.full_name === 'Pedro Lima')?.attendance_status === 'declined', rows);
  r = await submit(grp.code, {
    status: 'declined',
    companions: [
      { guestId: comps[0].id, status: 'attending' },
      { guestId: comps[1].id, status: 'attending' },
    ],
  });
  rows = await guestsOf(grp.id);
  check('se o principal não vai, os acompanhantes também não', r.status === 200 && rows.every((x) => x.attendance_status === 'declined'), rows);
  check('nenhum acompanhante criado pelo convidado', rows.length === 3);

  console.log('Isolamento entre convites');
  r = await submit(grp.code, { status: 'attending', companions: [{ guestId: comps[0].id, status: 'attending' }, { guestId: comps[1].id, status: 'attending' }, { guestId: (await api('/api/rsvp/verify', { code: grp.code })).data.invitation.companions[0].id, status: 'attending' }] });
  check('rejeita resposta repetida para o mesmo acompanhante', r.status === 409, r);
  const other = await invite('Carla Dias', ['Elisa Melo']);
  const otherComp = (await api('/api/rsvp/verify', { code: other.code })).data.invitation.companions[0];
  r = await submit(grp.code, { status: 'attending', companions: [{ guestId: comps[0].id, status: 'attending' }, { guestId: otherComp.id, status: 'attending' }] });
  check('não permite responder por acompanhante de outro convite', r.status === 409, r);
  rows = await guestsOf(other.id);
  check('acompanhante do outro convite intacto', rows.find((x) => x.full_name === 'Elisa Melo')?.attendance_status === 'pending', rows);

  console.log('Isolamento e convite inativo');
  const off = await invite('Convidado Inativo', ['Alguém Teste'], false);
  r = await api('/api/rsvp/verify', { code: off.code });
  check('rejeita convite inativo', r.status === 403, r);
  r = await submit(off.code, { status: 'attending' });
  check('rejeita envio para convite inativo', r.status === 403, r);

  console.log('Proteção contra força bruta');
  const attacker = ip();
  let last = 0;
  for (let i = 0; i < 10; i++) last = (await api('/api/rsvp/verify', { code: generateInviteCode() }, attacker)).status;
  check('bloqueia após tentativas inválidas repetidas (429)', last === 429, last);
  r = await api('/api/rsvp/verify', { code: ind.code }, attacker);
  check('bloqueio vale mesmo com código correto', r.status === 429);

  console.log('Honeypot e origem');
  r = await submit(ind.code, { website: 'spam', status: 'attending' });
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
