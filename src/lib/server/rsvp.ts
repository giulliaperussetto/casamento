import 'server-only';
import { z } from 'zod';
import { wedding } from '@/config/wedding';
import { db } from './db';
import { hashInviteCode, isPlausibleInviteCode } from './crypto';
import { clientKey, hitRateLimit, isRateLimited } from './rateLimit';

// ---------------------------------------------------------------------------
// Limites contra tentativas automatizadas de descobrir códigos
// ---------------------------------------------------------------------------
const LIMITS = {
  requestsPerIp: { limit: 30, window: 15 * 60 },     // qualquer requisição de RSVP
  failuresPerIp: { limit: 8, window: 60 * 60 },      // códigos inválidos por IP
  failuresGlobal: { limit: 400, window: 60 * 60 },   // freio global contra ataques distribuídos
};

export type PublicCompanion = { id: string; fullName: string; status: 'pending' | 'attending' | 'declined' };

export type PublicInvitation = {
  primaryName: string;
  status: 'pending' | 'attending' | 'declined';
  phone: string;
  email: string;
  message: string;
  companions: PublicCompanion[];
  alreadyResponded: boolean;
  canSubmit: boolean;
  closedReason: string | null;
};

export class RsvpError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Não encontramos esse código. Confira se ele foi digitado exatamente como aparece no seu convite.',
  INVITATION_INACTIVE: 'Este convite não está mais ativo. Se acredita que isso é um engano, fale com as noivas.',
  RATE_LIMITED: 'Muitas tentativas em pouco tempo. Por segurança, aguarde alguns minutos e tente novamente.',
  ALREADY_RESPONDED: 'Este convite já foi respondido. Para alterar sua resposta, fale com as noivas.',
  DEADLINE_PASSED: 'O prazo de confirmação foi encerrado. Para qualquer ajuste, fale diretamente com as noivas.',
  GUEST_NOT_IN_INVITATION: 'Os participantes enviados não correspondem a este convite. Verifique o código novamente.',
  DUPLICATE_GUEST: 'Cada participante pode ter apenas uma resposta.',
  MISSING_RESPONSES: 'Escolha se cada acompanhante vai ou não antes de enviar.',
  NAME_LOCKED: 'Os nomes cadastrados no convite não podem ser alterados.',
  COMPANION_NOT_ALLOWED: 'Este convite não permite acompanhante.',
  CAPACITY_EXCEEDED: 'O número de acompanhantes ultrapassa as vagas do seu convite.',
  DUPLICATE_NAME: 'Cada acompanhante deve ter um nome diferente (e diferente do seu).',
  INVALID_NAME: 'Informe nome e sobrenome de cada acompanhante.',
  INVALID_PHONE: 'Informe um telefone válido com DDD, por exemplo (11) 98765-4321.',
  COMPANIONS_NOT_EXPECTED: 'Você marcou que não levará acompanhante. Remova os acompanhantes informados ou desmarque essa opção.',
  COMPANION_CHOICE_REQUIRED: 'Informe seus acompanhantes ou marque que não levará acompanhante.',
  INVALID_STATUS: 'Escolha uma resposta para cada participante antes de enviar.',
  INVALID_PAYLOAD: 'Não foi possível entender a resposta enviada. Atualize a página e tente novamente.',
};

function fail(code: string, status = 400): never {
  throw new RsvpError(code, MESSAGES[code] ?? 'Não foi possível concluir agora. Tente novamente em instantes.', status);
}

function deadlinePassed() {
  return Date.now() > new Date(wedding.rsvp.deadlineIso).getTime();
}

async function guardRequest(ip: string) {
  if (!(await hitRateLimit(`rsvp:req:${ip}`, LIMITS.requestsPerIp.limit, LIMITS.requestsPerIp.window))) {
    fail('RATE_LIMITED', 429);
  }
  if (
    (await isRateLimited(`rsvp:fail:${ip}`, LIMITS.failuresPerIp.limit, LIMITS.failuresPerIp.window)) ||
    (await isRateLimited('rsvp:fail:global', LIMITS.failuresGlobal.limit, LIMITS.failuresGlobal.window))
  ) {
    fail('RATE_LIMITED', 429);
  }
}

async function registerFailure(ip: string) {
  await hitRateLimit(`rsvp:fail:${ip}`, LIMITS.failuresPerIp.limit, LIMITS.failuresPerIp.window);
  await hitRateLimit('rsvp:fail:global', LIMITS.failuresGlobal.limit, LIMITS.failuresGlobal.window);
}

type InvitationRow = {
  id: string;
  invitation_type: 'individual' | 'couple';
  max_guests: number;
  allow_unnamed_companion: boolean;
  active: boolean;
  contact_email: string | null;
  guest_message: string | null;
  companions_declined: boolean;
};

/** Localiza o convite pelo código (somente via hash) aplicando os limites de segurança. */
async function resolveInvitation(rawCode: string): Promise<InvitationRow> {
  const ip = await clientKey();
  await guardRequest(ip);

  if (!isPlausibleInviteCode(rawCode)) {
    await registerFailure(ip);
    fail('INVALID_CODE', 404);
  }

  const sql = db();
  const [inv] = await sql<InvitationRow[]>`
    select id, invitation_type, max_guests, allow_unnamed_companion, active, contact_email, guest_message, companions_declined
    from wedding.invitations where code_hash = ${hashInviteCode(rawCode)}`;

  if (!inv) {
    await registerFailure(ip);
    // Pequeno atraso para desencorajar tentativas em sequência
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    fail('INVALID_CODE', 404);
  }
  if (!inv.active) fail('INVITATION_INACTIVE', 403);
  return inv;
}

async function loadPublicInvitation(inv: InvitationRow): Promise<PublicInvitation> {
  const sql = db();
  const guests = await sql<
    { id: string; full_name: string; guest_role: 'primary' | 'companion'; attendance_status: PublicInvitation['status']; phone: string | null }[]
  >`
    select id, full_name, guest_role, attendance_status, phone
    from wedding.guests where invitation_id = ${inv.id}
    order by case guest_role when 'primary' then 0 else 1 end, created_at`;

  const primary = guests.find((g) => g.guest_role === 'primary');
  const status = primary?.attendance_status ?? 'pending';
  const alreadyResponded = status !== 'pending';
  let closedReason: string | null = null;
  if (deadlinePassed()) closedReason = MESSAGES.DEADLINE_PASSED;
  else if (alreadyResponded && !wedding.rsvp.allowChanges) closedReason = MESSAGES.ALREADY_RESPONDED;

  // Apenas os dados do próprio convite; nenhum identificador interno.
  return {
    primaryName: primary?.full_name ?? '',
    status,
    phone: primary?.phone ?? '',
    email: inv.contact_email ?? '',
    message: inv.guest_message ?? '',
    // Os ids só permitem responder por pessoas deste mesmo convite (validado no banco).
    companions: guests
      .filter((g) => g.guest_role === 'companion')
      .map((g) => ({ id: g.id, fullName: g.full_name, status: g.attendance_status })),
    alreadyResponded,
    canSubmit: closedReason === null,
    closedReason,
  };
}

export async function verifyInvitation(rawCode: string): Promise<PublicInvitation> {
  const inv = await resolveInvitation(rawCode);
  return loadPublicInvitation(inv);
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------
/** Mantém apenas dígitos; aceita com ou sem +55. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

const phoneSchema = z
  .string()
  .max(30)
  .transform(normalizePhone)
  .refine((v) => /^[0-9]{10,13}$/.test(v), 'INVALID_PHONE');

export const submitSchema = z.object({
  code: z.string().min(1).max(64),
  status: z.enum(['attending', 'declined']),
  phone: phoneSchema,
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(1000).optional(),
  companions: z
    .array(z.object({ guestId: z.string().uuid(), status: z.enum(['attending', 'declined']) }))
    .max(20)
    .default([]),
});

export type SubmitInput = z.infer<typeof submitSchema>;

export async function submitRsvp(input: SubmitInput) {
  const inv = await resolveInvitation(input.code);
  if (deadlinePassed()) fail('DEADLINE_PASSED', 403);

  const sql = db();
  try {
    const [row] = await sql<{ result: { event_id: string; updated: boolean } }[]>`
      select wedding.submit_rsvp_v4(
        ${inv.id}::uuid,
        ${input.status},
        ${input.phone},
        ${sql.json(input.companions.map((c) => ({ guest_id: c.guestId, status: c.status })))}::jsonb,
        ${input.email},
        ${input.message ?? null},
        ${wedding.rsvp.allowChanges}
      ) as result`;
    const [fresh] = await sql<InvitationRow[]>`
      select id, invitation_type, max_guests, allow_unnamed_companion, active, contact_email, guest_message, companions_declined
      from wedding.invitations where id = ${inv.id}`;
    const invitation = await loadPublicInvitation(fresh);
    return { eventId: row.result.event_id, updated: row.result.updated, invitation };
  } catch (err) {
    const message = (err as { message?: string }).message ?? '';
    if (MESSAGES[message]) fail(message, 409);
    if ((err as { code?: string }).code === '23505') fail('DUPLICATE_NAME', 409);
    if ((err as { code?: string }).code === '23514') fail('INVALID_PHONE', 409);
    throw err;
  }
}
