'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { login, logout, requireAdmin } from '@/lib/server/auth';
import * as admin from '@/lib/server/admin';

// Server Actions do Next.js já validam a origem (proteção CSRF) e cada ação
// verifica a sessão administrativa no servidor antes de qualquer operação.

export async function loginAction(_prev: { error: string; email: string } | null, formData: FormData) {
  const email = String(formData.get('email') ?? '').slice(0, 200);
  const password = String(formData.get('password') ?? '').slice(0, 200);
  if (!email || !password) return { error: 'Informe e-mail e senha.', email };
  let result: Awaited<ReturnType<typeof login>>;
  try {
    result = await login(email, password);
  } catch (err) {
    console.error('[admin] falha no login', err);
    return {
      error: 'Não foi possível conectar ao banco de dados. Abra /diagnostico para ver o que falta configurar.',
      email,
    };
  }
  if (!result.ok) return { error: result.error, email };
  redirect('/admin');
}

export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}

/**
 * Volta para a página de onde a ação veio (campo oculto "returnTo"),
 * aceitando apenas caminhos internos do painel.
 */
function back(formData: FormData, params: Record<string, string>, fallback = '/admin/convites'): never {
  revalidatePath('/admin', 'layout');
  const raw = String(formData.get('returnTo') ?? '');
  const base = /^\/admin(\/[a-z-]*)?(\?.*)?$/.test(raw) ? raw : fallback;
  const url = new URL(base, 'http://x');
  for (const k of ['ok', 'error', 'open']) url.searchParams.delete(k);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

function errorMessage(err: unknown): string {
  const msg = (err as Error).message ?? '';
  if (msg.includes('CAPACITY_EXCEEDED')) return 'O número de vagas não comporta os acompanhantes já registrados neste convite.';
  if ((err as { code?: string }).code === '23505') return 'Registro duplicado (nome repetido).';
  if ((err as { code?: string }).code === '23514') return 'Dados inválidos (verifique nomes, telefones e cores).';
  return msg || 'Não foi possível concluir a operação.';
}

const name = z.string().trim().min(2, 'Nome muito curto.').max(120, 'Nome muito longo.');
const uuid = z.string().uuid();
const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));
const statusEnum = z.enum(['pending', 'attending', 'declined']);

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || /^[0-9]{10,13}$/.test(v), 'Telefone inválido (use DDD + número).')
  .transform((v) => v || null);

// ---------------------------------------------------------------------------
// Convites
// ---------------------------------------------------------------------------
const createSchema = z.object({
  label: z.string().trim().max(120).optional(),
  primaryName: name,
  tagId: optionalUuid,
  companions: z.array(name).max(20, 'Máximo de 20 acompanhantes por convite.'),
});

export async function createInvitationAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    label: formData.get('label') ?? undefined,
    primaryName: formData.get('primaryName'),
    tagId: String(formData.get('tagId') ?? ''),
    companions: formData.getAll('companions').map((v) => String(v)),
  });
  if (!parsed.success) back(formData, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, '/admin/novo');
  let created: { id: string; code: string };
  try {
    created = await admin.createInvitation(parsed.data);
  } catch (err) {
    back(formData, { error: errorMessage(err) }, '/admin/novo');
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/convites?${new URLSearchParams({ ok: `Convite criado. Código: ${created.code}`, open: created.id })}`);
}

export async function toggleActiveAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const active = formData.get('active') === 'true';
  await admin.setInvitationActive(id, active);
  back(formData, { ok: active ? 'Convite ativado.' : 'Convite desativado.', open: id });
}

export async function updateInvitationAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const label = String(formData.get('label') ?? '').trim().slice(0, 120) || null;
  const tagId = optionalUuid.parse(String(formData.get('tagId') ?? ''));
  await admin.updateInvitation(id, { label, tagId });
  back(formData, { ok: 'Convite atualizado.', open: id });
}

export async function setSentAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const sent = formData.get('sent') === 'true';
  await admin.setInvitationSent(id, sent);
  back(formData, { ok: sent ? 'Convite marcado como enviado.' : 'Convite marcado como não enviado.', open: id });
}

/** Chamado pelo botão do WhatsApp: marca como enviado sem sair da página. */
export async function markSentQuickAction(id: string) {
  await requireAdmin();
  await admin.setInvitationSent(uuid.parse(id), true);
  revalidatePath('/admin', 'layout');
}

export async function regenerateCodeAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const code = await admin.regenerateCode(id);
  back(formData, { ok: `Novo código gerado: ${code}. O código anterior deixou de funcionar.`, open: id });
}

export async function deleteInvitationAction(formData: FormData) {
  await requireAdmin();
  await admin.deleteInvitation(uuid.parse(formData.get('id')));
  back(formData, { ok: 'Convite excluído.' });
}

// ---------------------------------------------------------------------------
// Convidados
// ---------------------------------------------------------------------------
const guestSchema = z.object({
  guestId: uuid,
  invitationId: uuid,
  fullName: name,
  phone,
  status: statusEnum,
});

export async function updateGuestAction(formData: FormData) {
  await requireAdmin();
  const parsed = guestSchema.safeParse({
    guestId: formData.get('guestId'),
    invitationId: formData.get('invitationId'),
    fullName: formData.get('fullName'),
    phone: String(formData.get('phone') ?? ''),
    status: formData.get('status'),
  });
  if (!parsed.success) back(formData, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
  try {
    await admin.updateGuest(parsed.data.guestId, { fullName: parsed.data.fullName, phone: parsed.data.phone, status: parsed.data.status });
  } catch (err) {
    back(formData, { error: errorMessage(err), open: parsed.data.invitationId });
  }
  back(formData, { ok: 'Convidado atualizado.', open: parsed.data.invitationId });
}

/** Troca rápida de status (lista geral). */
export async function setGuestStatusAction(formData: FormData) {
  await requireAdmin();
  const guestId = uuid.parse(formData.get('guestId'));
  const status = statusEnum.parse(formData.get('status'));
  await admin.setGuestStatus(guestId, status);
  revalidatePath('/admin', 'layout');
}

export async function addCompanionAction(formData: FormData) {
  await requireAdmin();
  const invitationId = uuid.parse(formData.get('invitationId'));
  const parsed = name.safeParse(formData.get('fullName'));
  if (!parsed.success) back(formData, { error: 'Informe o nome completo do acompanhante.', open: invitationId });
  const tel = phone.safeParse(String(formData.get('phone') ?? ''));
  if (!tel.success) back(formData, { error: 'Telefone inválido (use DDD + número).', open: invitationId });
  try {
    await admin.addCompanion(invitationId, parsed.data, tel.data);
  } catch (err) {
    back(formData, { error: errorMessage(err), open: invitationId });
  }
  back(formData, { ok: 'Acompanhante cadastrado.', open: invitationId });
}

export async function removeCompanionAction(formData: FormData) {
  await requireAdmin();
  const invitationId = uuid.parse(formData.get('invitationId'));
  await admin.removeCompanion(uuid.parse(formData.get('guestId')));
  back(formData, { ok: 'Acompanhante removido.', open: invitationId });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
const tagSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a tag.').max(40, 'Nome da tag muito longo.'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida.'),
});

export async function createTagAction(formData: FormData) {
  await requireAdmin();
  const parsed = tagSchema.safeParse({ name: formData.get('name'), color: formData.get('color') });
  if (!parsed.success) back(formData, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, '/admin/tags');
  try {
    await admin.createTag(parsed.data.name, parsed.data.color);
  } catch (err) {
    back(formData, { error: errorMessage(err) }, '/admin/tags');
  }
  back(formData, { ok: 'Tag criada.' }, '/admin/tags');
}

export async function updateTagAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const parsed = tagSchema.safeParse({ name: formData.get('name'), color: formData.get('color') });
  if (!parsed.success) back(formData, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, '/admin/tags');
  try {
    await admin.updateTag(id, parsed.data.name, parsed.data.color);
  } catch (err) {
    back(formData, { error: errorMessage(err) }, '/admin/tags');
  }
  back(formData, { ok: 'Tag atualizada.' }, '/admin/tags');
}

export async function deleteTagAction(formData: FormData) {
  await requireAdmin();
  await admin.deleteTag(uuid.parse(formData.get('id')));
  back(formData, { ok: 'Tag excluída. Os convites dessa tag ficaram sem tag.' }, '/admin/tags');
}

// ---------------------------------------------------------------------------
// Configurações (convidados contratados e staff)
// ---------------------------------------------------------------------------
const settingsSchema = z.object({
  contractedGuests: z.coerce.number().int().min(1, 'Informe o número contratado.').max(5000),
  staffCount: z.coerce.number().int().min(0).max(500),
  staffWeight: z.enum(['0.5', '1']).transform(Number),
});

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    contractedGuests: formData.get('contractedGuests'),
    staffCount: formData.get('staffCount'),
    staffWeight: formData.get('staffWeight'),
  });
  if (!parsed.success) back(formData, { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, '/admin');
  await admin.saveSettings(parsed.data);
  back(formData, { ok: 'Configurações salvas.' }, '/admin');
}
