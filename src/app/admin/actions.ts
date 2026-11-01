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
  const result = await login(email, password);
  if (!result.ok) return { error: result.error, email };
  redirect('/admin');
}

export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}

function back(params: Record<string, string>): never {
  revalidatePath('/admin');
  redirect(`/admin?${new URLSearchParams(params).toString()}`);
}

function errorMessage(err: unknown): string {
  const msg = (err as Error).message ?? '';
  if (msg.includes('CAPACITY_EXCEEDED')) return 'O número de vagas não comporta os acompanhantes já registrados neste convite.';
  if ((err as { code?: string }).code === '23505') return 'Registro duplicado: este convite já possui esse participante.';
  if ((err as { code?: string }).code === '23514') return 'Dados inválidos (verifique nomes e telefones).';
  return msg || 'Não foi possível concluir a operação.';
}

const name = z.string().trim().min(2, 'Nome muito curto.').max(120, 'Nome muito longo.');
const uuid = z.string().uuid();

const slots = z.coerce.number().int().min(0, 'Vagas inválidas.').max(20, 'Máximo de 20 acompanhantes.');
const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || /^[0-9]{10,13}$/.test(v), 'Telefone inválido (use DDD + número).')
  .transform((v) => v || null);

const createSchema = z.object({
  label: z.string().trim().max(120).optional(),
  primaryName: name,
  companions: slots,
});

export async function createInvitationAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
  let created: { id: string; code: string };
  try {
    created = await admin.createInvitation({
      label: parsed.data.label,
      primaryName: parsed.data.primaryName,
      companions: parsed.data.companions,
    });
  } catch (err) {
    back({ error: errorMessage(err) });
  }
  back({ ok: `Convite criado. Código: ${created.code}`, highlight: created.id });
}

export async function toggleActiveAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const active = formData.get('active') === 'true';
  await admin.setInvitationActive(id, active);
  back({ ok: active ? 'Convite ativado.' : 'Convite desativado.', highlight: id });
}

export async function updateInvitationAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const label = String(formData.get('label') ?? '').trim().slice(0, 120) || null;
  const companions = slots.safeParse(formData.get('companions'));
  if (!companions.success) back({ error: 'Número de vagas inválido.', highlight: id });
  try {
    await admin.updateInvitation(id, { label, companions: companions.data });
  } catch (err) {
    back({ error: errorMessage(err), highlight: id });
  }
  back({ ok: 'Convite atualizado.', highlight: id });
}

export async function regenerateCodeAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get('id'));
  const code = await admin.regenerateCode(id);
  back({ ok: `Novo código gerado: ${code}. O código anterior deixou de funcionar.`, highlight: id });
}

export async function deleteInvitationAction(formData: FormData) {
  await requireAdmin();
  await admin.deleteInvitation(uuid.parse(formData.get('id')));
  back({ ok: 'Convite excluído.' });
}

const guestSchema = z.object({
  guestId: uuid,
  invitationId: uuid,
  fullName: name,
  phone,
  status: z.enum(['pending', 'attending', 'declined']),
});

export async function updateGuestAction(formData: FormData) {
  await requireAdmin();
  const parsed = guestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) back({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
  try {
    await admin.updateGuest(parsed.data.guestId, { fullName: parsed.data.fullName, phone: parsed.data.phone, status: parsed.data.status });
  } catch (err) {
    back({ error: errorMessage(err), highlight: parsed.data.invitationId });
  }
  back({ ok: 'Convidado atualizado.', highlight: parsed.data.invitationId });
}

export async function addCompanionAction(formData: FormData) {
  await requireAdmin();
  const invitationId = uuid.parse(formData.get('invitationId'));
  const parsed = name.safeParse(formData.get('fullName'));
  if (!parsed.success) back({ error: 'Informe o nome completo do acompanhante.', highlight: invitationId });
  const tel = phone.safeParse(String(formData.get('phone') ?? ''));
  if (!tel.success) back({ error: 'Telefone inválido (use DDD + número).', highlight: invitationId });
  try {
    await admin.addCompanion(invitationId, parsed.data, tel.data);
  } catch (err) {
    back({ error: errorMessage(err), highlight: invitationId });
  }
  back({ ok: 'Acompanhante cadastrado.', highlight: invitationId });
}

export async function removeCompanionAction(formData: FormData) {
  await requireAdmin();
  const invitationId = uuid.parse(formData.get('invitationId'));
  await admin.removeCompanion(uuid.parse(formData.get('guestId')));
  back({ ok: 'Acompanhante removido.', highlight: invitationId });
}
