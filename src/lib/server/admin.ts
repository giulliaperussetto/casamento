import 'server-only';
import { db } from './db';
import { decryptInviteCode, encryptInviteCode, generateInviteCode, hashInviteCode } from './crypto';

export type AdminGuest = {
  id: string;
  full_name: string;
  guest_role: 'primary' | 'companion';
  name_locked: boolean;
  attendance_status: 'pending' | 'attending' | 'declined';
  responded_at: Date | null;
};

export type AdminInvitation = {
  id: string;
  code: string | null;
  label: string | null;
  invitation_type: 'individual' | 'couple';
  max_guests: number;
  allow_unnamed_companion: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  guests: AdminGuest[];
};

export type StatusFilter = 'all' | 'attending' | 'declined' | 'pending' | 'inactive';

export async function listInvitations(filter: StatusFilter = 'all', search = ''): Promise<AdminInvitation[]> {
  const sql = db();
  const term = `%${search.trim().toLowerCase()}%`;
  const rows = await sql<(Omit<AdminInvitation, 'code'> & { code_encrypted: string | null })[]>`
    select i.id, i.code_encrypted, i.label, i.invitation_type, i.max_guests, i.allow_unnamed_companion,
           i.active, i.created_at, i.updated_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', g.id, 'full_name', g.full_name, 'guest_role', g.guest_role, 'name_locked', g.name_locked,
             'attendance_status', g.attendance_status, 'responded_at', g.responded_at
           ) order by g.guest_role desc, g.created_at) filter (where g.id is not null), '[]') as guests
    from wedding.invitations i
    left join wedding.guests g on g.invitation_id = i.id
    group by i.id
    having (${search.trim() === ''} or bool_or(lower(g.full_name) like ${term}) or lower(coalesce(i.label, '')) like ${term})
       and (
         ${filter} = 'all'
         or (${filter} = 'inactive' and not i.active)
         or (${filter} <> 'inactive' and bool_or(g.attendance_status = ${filter}))
       )
    order by i.created_at desc`;
  return rows.map(({ code_encrypted, ...r }) => ({ ...r, code: decryptInviteCode(code_encrypted) }));
}

export async function getStats() {
  const [row] = await db()<
    { invitations: number; active: number; guests: number; attending: number; declined: number; pending: number }[]
  >`
    select
      (select count(*) from wedding.invitations)::int as invitations,
      (select count(*) from wedding.invitations where active)::int as active,
      count(g.*)::int as guests,
      count(*) filter (where g.attendance_status = 'attending')::int as attending,
      count(*) filter (where g.attendance_status = 'declined')::int as declined,
      count(*) filter (where g.attendance_status = 'pending')::int as pending
    from wedding.guests g join wedding.invitations i on i.id = g.invitation_id and i.active`;
  return row;
}

export type CreateInvitationInput = {
  type: 'individual' | 'couple';
  label?: string | null;
  primaryName: string;
  companionName?: string | null;
  allowUnnamedCompanion?: boolean;
  /** Opcional: usar um código já impresso (será normalizado e armazenado apenas como hash). */
  code?: string | null;
};

export async function createInvitation(input: CreateInvitationInput): Promise<{ id: string; code: string }> {
  const sql = db();
  const companion = input.type === 'couple' ? input.companionName?.trim() || null : null;
  const allowUnnamed = input.type === 'couple' && !companion && !!input.allowUnnamedCompanion;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = input.code?.trim().toUpperCase() || generateInviteCode();
    try {
      const id = await sql.begin(async (tx) => {
        const [inv] = await tx<{ id: string }[]>`
          insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion)
          values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, ${input.label?.trim() || null},
                  ${input.type}, ${input.type === 'couple' ? 2 : 1}, ${allowUnnamed})
          returning id`;
        const [primary] = await tx<{ id: string }[]>`
          insert into wedding.guests (invitation_id, full_name, guest_role)
          values (${inv.id}, ${input.primaryName.trim()}, 'primary') returning id`;
        await tx`update wedding.invitations set primary_guest_id = ${primary.id} where id = ${inv.id}`;
        if (companion) {
          await tx`insert into wedding.guests (invitation_id, full_name, guest_role)
                   values (${inv.id}, ${companion}, 'companion')`;
        }
        await tx`insert into wedding.rsvp_events (invitation_id, event_type) values (${inv.id}, 'invitation_created')`;
        return inv.id;
      });
      return { id, code };
    } catch (err) {
      const e = err as { code?: string; constraint_name?: string };
      // Colisão de código (extremamente improvável): gera outro
      if (e.code === '23505' && e.constraint_name === 'invitations_code_hash_key' && !input.code) continue;
      if (e.code === '23505' && e.constraint_name === 'invitations_code_hash_key') {
        throw new Error('Já existe um convite com esse código.');
      }
      throw err;
    }
  }
  throw new Error('Não foi possível gerar um código único.');
}

export async function setInvitationActive(id: string, active: boolean) {
  const sql = db();
  await sql`update wedding.invitations set active = ${active} where id = ${id}`;
  await sql`insert into wedding.rsvp_events (invitation_id, event_type)
            values (${id}, ${active ? 'invitation_activated' : 'invitation_deactivated'})`;
}

export async function updateInvitation(id: string, data: { label: string | null; allowUnnamedCompanion: boolean }) {
  await db()`
    update wedding.invitations
       set label = ${data.label},
           allow_unnamed_companion = (invitation_type = 'couple' and ${data.allowUnnamedCompanion})
     where id = ${id}`;
}

export async function regenerateCode(id: string): Promise<string> {
  const code = generateInviteCode();
  const sql = db();
  await sql`update wedding.invitations set code_hash = ${hashInviteCode(code)}, code_encrypted = ${encryptInviteCode(code)}
            where id = ${id}`;
  await sql`insert into wedding.rsvp_events (invitation_id, event_type) values (${id}, 'code_regenerated')`;
  return code;
}

export async function updateGuest(
  guestId: string,
  data: { fullName: string; status: 'pending' | 'attending' | 'declined' },
) {
  await db()`
    update wedding.guests
       set full_name = ${data.fullName.trim()},
           attendance_status = ${data.status},
           responded_at = case
             when ${data.status} = 'pending' then null
             when attendance_status <> ${data.status} then now()
             else responded_at end
     where id = ${guestId}`;
}

export async function addCompanion(invitationId: string, fullName: string) {
  // Os gatilhos do banco garantem: apenas convites de casal e no máximo 2 pessoas.
  await db()`insert into wedding.guests (invitation_id, full_name, guest_role)
             values (${invitationId}, ${fullName.trim()}, 'companion')`;
}

export async function removeCompanion(guestId: string) {
  await db()`delete from wedding.guests where id = ${guestId} and guest_role = 'companion'`;
}

export async function deleteInvitation(id: string) {
  await db()`delete from wedding.invitations where id = ${id}`;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------
const STATUS_LABEL = { pending: 'Pendente', attending: 'Confirmado', declined: 'Não comparecerá' } as const;

function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  // Evita injeção de fórmulas ao abrir no Excel/Sheets
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCsv(): Promise<string> {
  const invitations = await listInvitations('all');
  const header = ['Convite', 'Código', 'Tipo', 'Ativo', 'Convidado', 'Papel', 'Status', 'Respondido em'];
  const lines = [header.join(';')];
  for (const inv of invitations) {
    for (const g of inv.guests) {
      lines.push(
        [
          inv.label ?? '',
          inv.code ?? '',
          inv.invitation_type === 'couple' ? 'Casal' : 'Individual',
          inv.active ? 'Sim' : 'Não',
          g.full_name,
          g.guest_role === 'primary' ? 'Principal' : 'Acompanhante',
          STATUS_LABEL[g.attendance_status],
          g.responded_at ? new Date(g.responded_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '',
        ]
          .map(csvCell)
          .join(';'),
      );
    }
  }
  return '﻿' + lines.join('\r\n');
}
