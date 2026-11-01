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

async function invite(primary: string, slots: number, active = true) {
  const code = generateInviteCode();
  const [inv] = await sql<{ id: string }[]>`
    insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion, active)
    values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, 'TESTE-AUTO', ${slots > 0 ? 'group' : 'individual'}, ${1 + slots}, ${slots > 0}, ${active})
    returning id`;
  const [g] = await sql<{ id: string }[]>`insert into wedding.guests (invitation_id, full_name, guest_role) values (${inv.id}, ${primary}, 'primary') returning id`;
  await sql`update wedding.invitations set primary_guest_id = ${g.id} where id = ${inv.id}`;
  return { id: inv.id, code };
}

const base = { email: 'convidado@example.com', phone: '(11) 98765-4321' };
const submit = (code: string, extra: any, fromIp?: string) => api('/api/rsvp/submit', { code, ...base, ...extra }, fromIp);
const guestsOf = (id: string) => sql`select full_name, guest_role, attendance_status, phone from wedding.guests where invitation_id = ${id} order by guest_role desc, created_at`;

try {
  console.log('Código inválido');
  let r = await api('/api/rsvp/verify', { code: 'CASA-ZZZZZ-ZZZZZ' });
  check('retorna 404 com mensagem amigável', r.status === 404 && /Não encontramos/.test(r.data.error), r);

  console.log('Convite individual (0 vagas)');
  const ind = await invite('Mariana Oliveira', 0);
  r = await api('/api/rsvp/verify', { code: ind.code.toLowerCase().replace(/-/g, ' ') });
  check('valida código (sem diferenciar maiúsculas/hífens)', r.status === 200, r);
  check('exibe nome cadastrado e 0 vagas', r.data.invitation.primaryName === 'Mariana Oliveira' && r.data.invitation.maxCompanions === 0);
  check('não expõe ids internos', !JSON.stringify(r.data).includes(ind.id) && !/"id"/.test(JSON.stringify(r.data)));
  r = await submit(ind.code, { status: 'attending', companions: [{ fullName: 'Intruso da Silva', phone: '11999990000' }] });
  check('rejeita acompanhante em convite sem vagas', r.status === 409, r);
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

  console.log('Convite com 2 vagas de acompanhante');
  const grp = await invite('Rafael Almeida', 2);
  r = await api('/api/rsvp/verify', { code: grp.code });
  check('informa 2 vagas', r.data.invitation.maxCompanions === 2);
  r = await submit(grp.code, { status: 'attending' });
  check('exige acompanhantes ou "não vou levar"', r.status === 409 && /não levará/.test(r.data.error), r);
  r = await submit(grp.code, {
    status: 'attending',
    companions: [
      { fullName: 'Juliana Prado', phone: '11911112222' },
      { fullName: 'Pedro Lima', phone: '11933334444' },
      { fullName: 'Terceira Pessoa', phone: '11955556666' },
    ],
  });
  check('impede acompanhantes além das vagas', r.status === 409, r);
  r = await submit(grp.code, { status: 'attending', companions: [{ fullName: 'Juliana', phone: '11911112222' }] });
  check('exige nome e sobrenome', r.status === 409 && /sobrenome/.test(r.data.error), r);
  r = await submit(grp.code, { status: 'attending', companions: [{ fullName: 'Juliana Prado', phone: '123' }] });
  check('exige telefone válido do acompanhante', r.status === 400, r);
  r = await submit(grp.code, {
    status: 'attending',
    companions: [
      { fullName: 'Juliana Prado', phone: '11911112222' },
      { fullName: 'juliana prado', phone: '11933334444' },
    ],
  });
  check('impede acompanhantes duplicados', r.status === 409, r);
  r = await submit(grp.code, {
    status: 'attending',
    companions: [
      { fullName: 'Juliana Prado', phone: '(11) 91111-2222' },
      { fullName: 'Pedro Lima', phone: '+55 11 93333-4444' },
    ],
  });
  rows = await guestsOf(grp.id);
  check('salva 2 acompanhantes com nome e telefone', r.status === 200 && rows.length === 3 && rows[2].phone === '5511933334444', rows);
  r = await submit(grp.code, { status: 'attending', companions: [{ fullName: 'Juliana Prado', phone: '11911112222' }] });
  rows = await guestsOf(grp.id);
  check('nova resposta substitui os acompanhantes (sem duplicar)', r.status === 200 && rows.length === 2, rows);
  r = await submit(grp.code, { status: 'attending', noCompanions: true });
  rows = await guestsOf(grp.id);
  const [flag] = await sql`select companions_declined from wedding.invitations where id = ${grp.id}`;
  check('"não vou levar acompanhante" registrado', r.status === 200 && rows.length === 1 && flag.companions_declined === true, r);
  r = await api('/api/rsvp/verify', { code: grp.code });
  check('reabre com a opção marcada e sem acompanhantes', r.data.invitation.companionsDeclined === true && r.data.invitation.companions.length === 0);

  console.log('Concorrência');
  const conc = await invite('Carla Dias', 2);
  const results = await Promise.all(
    ['Ana Souza', 'Bruna Costa', 'Elisa Melo', 'Fabi Reis', 'Gabi Nunes'].map((n, i) =>
      submit(conc.code, {
        status: 'attending',
        companions: [
          { fullName: n, phone: `1190000000${i}` },
          { fullName: n + ' Filho', phone: `1191111111${i}` },
        ],
      }),
    ),
  );
  rows = await guestsOf(conc.id);
  check('envios simultâneos nunca ultrapassam as vagas', rows.length === 3 && results.every((x) => x.status === 200), [rows.length, results.map((x) => x.status)]);

  console.log('Isolamento e convite inativo');
  const off = await invite('Convidado Inativo', 1, false);
  r = await api('/api/rsvp/verify', { code: off.code });
  check('rejeita convite inativo', r.status === 403, r);
  r = await submit(off.code, { status: 'attending', noCompanions: true });
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
