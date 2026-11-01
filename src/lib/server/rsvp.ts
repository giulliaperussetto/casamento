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

export type PublicGuest = {
  id: string;
  fullName: string;
  role: 'primary' | 'companion';
  nameLocked: boolean;
  status: 'pending' | 'attending' | 'declined';
};

export type PublicInvitation = {
  type: 'individual' | 'couple';
  maxGuests: number;
  canAddCompanion: boolean;
  alreadyResponded: boolean;
  canSubmit: boolean;
  closedReason: string | null;
  email: string;
  message: string;
  guests: PublicGuest[];
};

export class RsvpError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Não encontramos esse código. Confira se ele foi digitado exatamente como aparece no seu convite.',
  INVITATION_INACTIVE: 'Este convite não está mais ativo. Se acredita que isso é um engano, fale com os noivos.',
  RATE_LIMITED: 'Muitas tentativas em pouco tempo. Por segurança, aguarde alguns minutos e tente novamente.',
  ALREADY_RESPONDED: 'Este convite já foi respondido. Para alterar sua resposta, fale com os noivos.',
  DEADLINE_PASSED: 'O prazo de confirmação foi encerrado. Para qualquer ajuste, fale diretamente com os noivos.',
  GUEST_NOT_IN_INVITATION: 'Os participantes enviados não correspondem a este convite. Verifique o código novamente.',
  DUPLICATE_GUEST: 'Cada participante pode ter apenas uma resposta.',
  MISSING_RESPONSES: 'Escolha uma resposta para cada participante antes de enviar.',
  NAME_LOCKED: 'Os nomes cadastrados no convite não podem ser alterados.',
  COMPANION_NOT_ALLOWED: 'Este convite não permite acompanhante.',
  COMPANION_ALREADY_EXISTS: 'O acompanhante deste convite já foi registrado.',
  CAPACITY_EXCEEDED: 'Este convite já atingiu o número máximo de participantes.',
  DUPLICATE_NAME: 'O nome do acompanhante não pode repetir um participante já registrado.',
  INVALID_NAME: 'Informe o nome completo do acompanhante (entre 2 e 120 caracteres).',
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
    select id, invitation_type, max_guests, allow_unnamed_companion, active, contact_email, guest_message
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
    { id: string; full_name: string; guest_role: 'primary' | 'companion'; name_locked: boolean; attendance_status: PublicGuest['status'] }[]
  >`
    select id, full_name, guest_role, name_locked, attendance_status
    from wedding.guests where invitation_id = ${inv.id}
    order by case guest_role when 'primary' then 0 else 1 end, created_at`;

  const alreadyResponded = guests.some((g) => g.attendance_status !== 'pending');
  let closedReason: string | null = null;
  if (deadlinePassed()) closedReason = MESSAGES.DEADLINE_PASSED;
  else if (alreadyResponded && !wedding.rsvp.allowChanges) closedReason = MESSAGES.ALREADY_RESPONDED;

  return {
    type: inv.invitation_type,
    maxGuests: inv.max_guests,
    canAddCompanion:
      inv.invitation_type === 'couple' &&
      inv.allow_unnamed_companion &&
      !guests.some((g) => g.guest_role === 'companion') &&
      guests.length < inv.max_guests,
    alreadyResponded,
    canSubmit: closedReason === null,
    closedReason,
    email: inv.contact_email ?? '',
    message: inv.guest_message ?? '',
    // Apenas o necessário: nenhum dado de outros convites ou dados internos.
    guests: guests.map((g) => ({
      id: g.id,
      fullName: g.full_name,
      role: g.guest_role,
      nameLocked: g.name_locked,
      status: g.attendance_status,
    })),
  };
}

export async function verifyInvitation(rawCode: string): Promise<PublicInvitation> {
  const inv = await resolveInvitation(rawCode);
  return loadPublicInvitation(inv);
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------
const statusSchema = z.enum(['attending', 'declined']);
export const submitSchema = z.object({
  code: z.string().min(1).max(64),
  responses: z
    .array(
      z.object({
        guestId: z.string().uuid(),
        status: statusSchema,
        fullName: z.string().trim().min(2).max(120).optional(),
      }),
    )
    .min(1)
    .max(2),
  companion: z
    .object({ fullName: z.string().trim().min(2).max(120), status: statusSchema })
    .nullable()
    .optional(),
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(1000).optional(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

export async function submitRsvp(input: SubmitInput) {
  const inv = await resolveInvitation(input.code);
  if (deadlinePassed()) fail('DEADLINE_PASSED', 403);

  const sql = db();
  try {
    const [row] = await sql<{ result: { event_id: string; updated: boolean } }[]>`
      select wedding.submit_rsvp(
        ${inv.id}::uuid,
        ${sql.json(input.responses.map((r) => ({ guest_id: r.guestId, status: r.status, full_name: r.fullName ?? null })))}::jsonb,
        ${input.companion ? sql.json({ full_name: input.companion.fullName, status: input.companion.status }) : null}::jsonb,
        ${wedding.rsvp.allowChanges},
        ${input.email},
        ${input.message ?? null}
      ) as result`;
    const invitation = await loadPublicInvitation({ ...inv, contact_email: input.email, guest_message: input.message ?? null });
    return { eventId: row.result.event_id, updated: row.result.updated, invitation };
  } catch (err) {
    const message = (err as { message?: string }).message ?? '';
    if (MESSAGES[message]) fail(message, 409);
    // Violação de índice único (acompanhante duplicado em concorrência)
    if ((err as { code?: string }).code === '23505') fail('COMPANION_ALREADY_EXISTS', 409);
    throw err;
  }
}
