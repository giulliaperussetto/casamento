import 'server-only';
import { db } from './db';
import { decryptInviteCode } from './crypto';
import { wedding } from '@/config/wedding';

// ---------------------------------------------------------------------------
// Tipos de lembrete e quando cada um deve ser disparado
// ---------------------------------------------------------------------------
export type ReminderKind = 'prazo' | 'semana' | 'vespera';
export const REMINDER_KINDS: ReminderKind[] = ['prazo', 'semana', 'vespera'];

/** Modelos de mensagem editáveis no painel. */
export type TemplateKey = 'prazo' | 'semana_geral' | 'semana_padrinhos' | 'vespera_geral' | 'vespera_padrinhos';

const DAY = 24 * 60 * 60 * 1000;
/** Data (meio-dia em Brasília) de um ISO, menos N dias. */
function dayBefore(iso: string, days: number) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00-03:00');
  return new Date(d.getTime() - days * DAY);
}

export const REMINDERS: Record<
  ReminderKind,
  { title: string; short: string; audience: string; date: Date; endsAt: Date; templates: TemplateKey[] }
> = {
  prazo: {
    title: 'Lembrete do prazo de confirmação',
    short: 'Prazo da confirmação',
    audience: 'Quem recebeu o convite e ainda não respondeu (nem sim, nem não).',
    date: dayBefore(wedding.rsvp.deadlineIso, 1),
    endsAt: new Date(wedding.rsvp.deadlineIso),
    templates: ['prazo'],
  },
  semana: {
    title: 'Lembrete de 1 semana antes',
    short: '1 semana antes',
    audience: 'Quem confirmou presença. Madrinhas e padrinhos recebem uma mensagem própria.',
    date: dayBefore(wedding.date.iso, 7),
    endsAt: new Date(wedding.date.iso),
    templates: ['semana_geral', 'semana_padrinhos'],
  },
  vespera: {
    title: 'Lembrete da véspera',
    short: '1 dia antes',
    audience: 'Quem confirmou presença. Madrinhas e padrinhos recebem uma mensagem própria.',
    date: dayBefore(wedding.date.iso, 1),
    endsAt: new Date(wedding.date.iso),
    templates: ['vespera_geral', 'vespera_padrinhos'],
  },
};

export const TEMPLATE_LABEL: Record<TemplateKey, string> = {
  prazo: 'Mensagem para quem não respondeu',
  semana_geral: 'Mensagem para os convidados',
  semana_padrinhos: 'Mensagem para madrinhas e padrinhos',
  vespera_geral: 'Mensagem para os convidados',
  vespera_padrinhos: 'Mensagem para madrinhas e padrinhos',
};

/** Dias (no calendário de Brasília) entre hoje e a data do lembrete. */
export function daysUntil(date: Date, now = new Date()) {
  const key = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return Math.round((Date.parse(key(date)) - Date.parse(key(now))) / DAY);
}

export function fmtDay(d: Date) {
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Mensagens padrão ({variáveis} são trocadas para cada convidado)
// ---------------------------------------------------------------------------
const SIGN = ['Com carinho,', 'Fernanda & Giullia'];

export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  prazo: [
    'Oi, {nome}! Tudo bem?',
    '',
    'Passando para lembrar que a lista de convidados do nosso casamento fecha amanhã, {prazo}, e ainda não recebemos a sua resposta.',
    '',
    'Você vem celebrar com a gente? É rapidinho, é só confirmar por aqui:',
    '{link}',
    '',
    'Se não puder ir, pedimos que nos avise por lá também. Assim conseguimos organizar tudo com muito carinho.',
    '',
    ...SIGN,
  ].join('\n'),

  semana_geral: [
    'Oi, {nome}!',
    '',
    'Falta só uma semana! No dia {data} vamos dizer o nosso sim, e estamos muito felizes por ter você com a gente.',
    '',
    'Alguns lembretes:',
    '- Local: {local}. Como chegar: {maps}',
    '- Recepção a partir das 15h30. A cerimônia começa às 16h em ponto.',
    '- Dress code: esporte fino. Pedimos que não usem branco, bege, off-white ou tons claros (reservados às noivas), nem marsala ou cinza claro (das madrinhas e padrinhos). Jeans, shorts e chinelo não são permitidos.',
    '- O estacionamento do local é pago: R$ 35,00. Se for beber, venha de Uber ou outro aplicativo.',
    '',
    'Se tiver qualquer imprevisto, por favor avise a nossa assessoria: {assessoria}',
    '',
    ...SIGN,
  ].join('\n'),

  semana_padrinhos: [
    'Oi, {nome}!',
    '',
    'Falta só uma semana! No dia {data} você vai estar ao nosso lado como {papel}, e isso significa muito para nós.',
    '',
    'Lembretes importantes:',
    '- Chegada de madrinhas e padrinhos: {chegada_padrinhos} (antes dos convidados).',
    '- Seu traje: {traje}.',
    '- Local: {local}. Como chegar: {maps}',
    '- O estacionamento do local é pago: R$ 35,00.',
    '',
    'Se tiver qualquer imprevisto, por favor avise a nossa assessoria o quanto antes: {assessoria}',
    '',
    ...SIGN,
  ].join('\n'),

  vespera_geral: [
    'Oi, {nome}!',
    '',
    'É amanhã! Estamos muito empolgadas e mal podemos esperar para celebrar com você.',
    '',
    'Recepção a partir das 15h30 e cerimônia às 16h em ponto, no {local}.',
    'Como chegar: {maps}',
    '',
    'Contamos com você para animar a festa e não deixar a pista vazia!',
    '',
    'Se surgir qualquer imprevisto, por favor avise a nossa assessoria: {assessoria}',
    '',
    'Até amanhã!',
    'Fernanda & Giullia',
  ].join('\n'),

  vespera_padrinhos: [
    'Oi, {nome}!',
    '',
    'É amanhã! Estamos muito empolgadas e felizes por ter você ao nosso lado como {papel}.',
    '',
    'Só reforçando:',
    '- Chegada de madrinhas e padrinhos: {chegada_padrinhos}.',
    '- Seu traje: {traje}.',
    '- Local: {local}. Como chegar: {maps}',
    '',
    'Contamos com você para animar a festa e puxar todo mundo para a pista!',
    '',
    'Se surgir qualquer imprevisto, por favor avise a nossa assessoria o quanto antes: {assessoria}',
    '',
    'Até amanhã!',
    'Fernanda & Giullia',
  ].join('\n'),
};

export const TEMPLATE_VARS: { key: string; desc: string }[] = [
  { key: '{nome}', desc: 'primeiro nome do convidado' },
  { key: '{link}', desc: 'link pessoal do convite' },
  { key: '{prazo}', desc: `prazo da confirmação (${wedding.rsvp.deadlineLabel})` },
  { key: '{data}', desc: `data do casamento (${wedding.date.long})` },
  { key: '{local}', desc: wedding.venue.name },
  { key: '{maps}', desc: 'link do Google Maps' },
  { key: '{papel}', desc: 'madrinha ou padrinho (pela tag)' },
  { key: '{traje}', desc: 'traje da madrinha ou do padrinho' },
  { key: '{chegada_padrinhos}', desc: 'horário de chegada de madrinhas e padrinhos' },
  { key: '{assessoria}', desc: 'contato da assessoria' },
];

// ---------------------------------------------------------------------------
// Configurações (guardadas em wedding.settings)
// ---------------------------------------------------------------------------
export type ReminderSettings = {
  templates: Record<TemplateKey, string>;
  padrinhosArrival: string;
  assessoria: string;
  trajeMadrinha: string;
  trajePadrinho: string;
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const rows = await db()<{ key: string; value: unknown }[]>`
    select key, value from wedding.settings
     where key in ('reminder_templates', 'padrinhos_arrival', 'assessoria_contact', 'traje_madrinha', 'traje_padrinho')`;
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const saved = (m.reminder_templates ?? {}) as Partial<Record<TemplateKey, string>>;
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
  return {
    templates: Object.fromEntries(
      (Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]).map((k) => [k, str(saved[k]).trim() ? saved[k]! : DEFAULT_TEMPLATES[k]]),
    ) as Record<TemplateKey, string>,
    padrinhosArrival: str(m.padrinhos_arrival),
    assessoria: str(m.assessoria_contact),
    trajeMadrinha: str(m.traje_madrinha, 'vestido longo marsala'),
    trajePadrinho: str(m.traje_padrinho, 'terno cinza claro, camisa branca e tênis branco'),
  };
}

async function setSetting(key: string, value: unknown) {
  const sql = db();
  await sql`insert into wedding.settings (key, value) values (${key}, ${sql.json(value as never)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

export async function saveReminderInfo(info: Omit<ReminderSettings, 'templates'>) {
  await setSetting('padrinhos_arrival', info.padrinhosArrival);
  await setSetting('assessoria_contact', info.assessoria);
  await setSetting('traje_madrinha', info.trajeMadrinha);
  await setSetting('traje_padrinho', info.trajePadrinho);
}

/** Salva um modelo; texto vazio volta para o padrão. */
export async function saveTemplate(key: TemplateKey, text: string) {
  const current = (await getReminderSettings()).templates;
  const next: Partial<Record<TemplateKey, string>> = {};
  for (const k of Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]) {
    const v = k === key ? text : current[k];
    if (v.trim() && v !== DEFAULT_TEMPLATES[k]) next[k] = v;
  }
  await setSetting('reminder_templates', next);
}

// ---------------------------------------------------------------------------
// Quem recebe cada lembrete
// ---------------------------------------------------------------------------
export type Role = 'madrinha' | 'padrinho' | null;

/** Madrinha/padrinho pela tag do convite (ex.: "Madrinhas", "Padrinhos"). */
export function roleFromTag(tag: string | null): Role {
  const t = (tag ?? '').toLowerCase();
  if (t.includes('madrinh')) return 'madrinha';
  if (t.includes('padrinh')) return 'padrinho';
  return null;
}

export type ReminderTarget = {
  invitation_id: string;
  code: string | null;
  primary_name: string;
  phone: string | null;
  tag_name: string | null;
  tag_color: string | null;
  attending: number;
  people: number;
  role: Role;
  reminded_at: Date | null;
};

/**
 * prazo: convites enviados em que ninguém respondeu ainda.
 * semana / véspera: convites com pelo menos uma pessoa confirmada.
 * Quem respondeu "não vou" não recebe nada.
 */
export async function listTargets(kind: ReminderKind): Promise<ReminderTarget[]> {
  const rows = await db()<(Omit<ReminderTarget, 'code' | 'role'> & { code_encrypted: string | null; pending: number })[]>`
    select i.id as invitation_id, i.code_encrypted, p.full_name as primary_name, p.phone,
           t.name as tag_name, t.color as tag_color,
           count(g.*) filter (where g.attendance_status = 'attending')::int as attending,
           count(g.*) filter (where g.attendance_status = 'pending')::int as pending,
           count(g.*)::int as people,
           r.sent_at as reminded_at
      from wedding.invitations i
      join wedding.guests p on p.invitation_id = i.id and p.guest_role = 'primary'
      join wedding.guests g on g.invitation_id = i.id
      left join wedding.tags t on t.id = i.tag_id
      left join wedding.reminder_sends r on r.invitation_id = i.id and r.kind = ${kind}
     where i.active
       and (${kind} <> 'prazo' or i.sent_at is not null)
     group by i.id, p.id, t.id, r.sent_at`;
  return rows
    .filter((r) => (kind === 'prazo' ? r.pending === r.people : r.attending > 0))
    .map(({ code_encrypted, pending: _p, ...r }) => ({ ...r, code: decryptInviteCode(code_encrypted), role: roleFromTag(r.tag_name) }))
    .sort((a, b) => a.primary_name.localeCompare(b.primary_name, 'pt-BR'));
}

export async function setReminderSent(invitationId: string, kind: ReminderKind, sent: boolean) {
  if (sent) {
    await db()`insert into wedding.reminder_sends (invitation_id, kind) values (${invitationId}, ${kind})
               on conflict (invitation_id, kind) do nothing`;
  } else {
    await db()`delete from wedding.reminder_sends where invitation_id = ${invitationId} and kind = ${kind}`;
  }
}

// ---------------------------------------------------------------------------
// Mensagem pronta e link do WhatsApp
// ---------------------------------------------------------------------------
/** Link curto do Maps (o link completo fica enorme dentro da mensagem). */
const MAPS_SHORT = `https://maps.google.com/?q=${encodeURIComponent(`${wedding.venue.name}, São Bernardo do Campo`).replace(/%20/g, '+')}`;

export function renderMessage(
  kind: ReminderKind,
  t: Pick<ReminderTarget, 'primary_name' | 'code' | 'role'>,
  s: ReminderSettings,
  origin: string,
) {
  const key: TemplateKey = kind === 'prazo' ? 'prazo' : t.role ? `${kind}_padrinhos` : `${kind}_geral`;
  const vars: Record<string, string> = {
    nome: t.primary_name.split(/\s+/)[0] ?? '',
    link: t.code ? `${origin}/${t.code}` : origin,
    prazo: wedding.rsvp.deadlineLabel,
    data: wedding.date.long,
    local: wedding.venue.name,
    maps: MAPS_SHORT,
    papel: t.role ?? 'madrinha/padrinho',
    traje: t.role === 'madrinha' ? s.trajeMadrinha : t.role === 'padrinho' ? s.trajePadrinho : '',
    chegada_padrinhos: s.padrinhosArrival || '[horário de chegada]',
    assessoria: s.assessoria || '[contato da assessoria]',
  };
  return s.templates[key].replace(/\{([a-z_]+)\}/g, (all, k: string) => vars[k] ?? all);
}

export function whatsappLink(phone: string | null, text: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const to = digits.length >= 10 ? (digits.length <= 11 ? `55${digits}` : digits) : '';
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

// ---------------------------------------------------------------------------
// Resumo para a página inicial e para a aba Lembretes
// ---------------------------------------------------------------------------
export type ReminderSummary = {
  kind: ReminderKind;
  date: Date;
  days: number;
  total: number;
  sent: number;
  toSend: number;
  /** Ainda faz sentido mandar (não passou do prazo/casamento). */
  open: boolean;
};

export async function getReminderSummaries(): Promise<ReminderSummary[] | null> {
  try {
    return await Promise.all(
      REMINDER_KINDS.map(async (kind) => {
        const targets = await listTargets(kind);
        const sent = targets.filter((t) => t.reminded_at).length;
        const r = REMINDERS[kind];
        return {
          kind,
          date: r.date,
          days: daysUntil(r.date),
          total: targets.length,
          sent,
          toSend: targets.length - sent,
          open: Date.now() < r.endsAt.getTime(),
        };
      }),
    );
  } catch (err) {
    // Tabela ainda não criada (arquivo 0008 não rodado).
    if ((err as { code?: string }).code === '42P01') return null;
    throw err;
  }
}
