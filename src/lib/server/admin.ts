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
  phone: string | null;
};

export type AdminInvitation = {
  id: string;
  code: string | null;
  label: string | null;
  invitation_type: 'individual' | 'couple' | 'group';
  max_guests: number;
  allow_unnamed_companion: boolean;
  active: boolean;
  contact_email: string | null;
  guest_message: string | null;
  companions_declined: boolean;
  tag_id: string | null;
  tag_name: string | null;
  tag_color: string | null;
  sent_at: Date | null;
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
           i.active, i.contact_email, i.guest_message, i.companions_declined, i.tag_id, t.name as tag_name, t.color as tag_color, i.sent_at, i.created_at, i.updated_at,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', g.id, 'full_name', g.full_name, 'guest_role', g.guest_role, 'name_locked', g.name_locked,
             'attendance_status', g.attendance_status, 'responded_at', g.responded_at, 'phone', g.phone
           ) order by g.guest_role desc, g.created_at) filter (where g.id is not null), '[]') as guests
    from wedding.invitations i
    left join wedding.guests g on g.invitation_id = i.id
    left join wedding.tags t on t.id = i.tag_id
    group by i.id, t.id
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
  label?: string | null;
  primaryName: string;
  tagId?: string | null;
  /** Nomes dos acompanhantes já definidos pelas noivas (pode ser vazio). */
  companions: string[];
  /** Opcional: usar um código já impresso (será armazenado apenas como hash). */
  code?: string | null;
};

export async function createInvitation(input: CreateInvitationInput): Promise<{ id: string; code: string }> {
  const sql = db();
  const companions = input.companions.map((n) => n.trim()).filter(Boolean).slice(0, 20);
  const slots = companions.length;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = input.code?.trim().toUpperCase() || generateInviteCode();
    try {
      const id = await sql.begin(async (tx) => {
        const [inv] = await tx<{ id: string }[]>`
          insert into wedding.invitations (code_hash, code_encrypted, label, invitation_type, max_guests, allow_unnamed_companion, tag_id)
          values (${hashInviteCode(code)}, ${encryptInviteCode(code)}, ${input.label?.trim() || null},
                  ${slots > 0 ? 'group' : 'individual'}, ${1 + slots}, ${slots > 0}, ${input.tagId || null})
          returning id`;
        const [primary] = await tx<{ id: string }[]>`
          insert into wedding.guests (invitation_id, full_name, guest_role)
          values (${inv.id}, ${input.primaryName.trim()}, 'primary') returning id`;
        await tx`update wedding.invitations set primary_guest_id = ${primary.id} where id = ${inv.id}`;
        for (const name of companions) {
          await tx`insert into wedding.guests (invitation_id, full_name, guest_role)
                   values (${inv.id}, ${name}, 'companion')`;
        }
        await tx`insert into wedding.rsvp_events (invitation_id, event_type) values (${inv.id}, 'invitation_created')`;
        return inv.id;
      });
      return { id, code };
    } catch (err) {
      const e = err as { code?: string; constraint_name?: string };
      if (e.code === '23505' && e.constraint_name === 'invitations_code_hash_key' && !input.code) continue;
      if (e.code === '23505' && e.constraint_name === 'invitations_code_hash_key') {
        throw new Error('Já existe um convite com esse código.');
      }
      if (e.code === '23505') throw new Error('Há nomes repetidos neste convite.');
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

export async function updateInvitation(id: string, data: { label: string | null; tagId: string | null }) {
  await db()`update wedding.invitations set label = ${data.label}, tag_id = ${data.tagId} where id = ${id}`;
}

export async function setInvitationSent(id: string, sent: boolean) {
  await db()`update wedding.invitations
               set sent_at = case when ${sent} then coalesce(sent_at, now()) else null end
             where id = ${id}`;
}

export async function setGuestStatus(guestId: string, status: 'pending' | 'attending' | 'declined') {
  await db()`
    update wedding.guests
       set attendance_status = ${status},
           responded_at = case when ${status} = 'pending' then null else now() end
     where id = ${guestId}`;
}

// ---------------------------------------------------------------------------
// Tags (internas; nunca aparecem no site)
// ---------------------------------------------------------------------------
export type Tag = { id: string; name: string; color: string; invitations: number };

export async function listTags(): Promise<Tag[]> {
  return db()<Tag[]>`
    select t.id, t.name, t.color, count(i.id)::int as invitations
      from wedding.tags t left join wedding.invitations i on i.tag_id = t.id
     group by t.id order by lower(t.name)`;
}

export async function createTag(name: string, color: string) {
  await db()`insert into wedding.tags (name, color) values (${name.trim()}, ${color})`;
}

export async function updateTag(id: string, name: string, color: string) {
  await db()`update wedding.tags set name = ${name.trim()}, color = ${color} where id = ${id}`;
}

export async function deleteTag(id: string) {
  await db()`delete from wedding.tags where id = ${id}`;
}

// ---------------------------------------------------------------------------
// Configurações e números da home
// ---------------------------------------------------------------------------
export type Settings = { contractedGuests: number; staffCount: number; staffWeight: number };

export async function getSettings(): Promise<Settings> {
  const rows = await db()<{ key: string; value: unknown }[]>`select key, value from wedding.settings`;
  const m = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
  return {
    contractedGuests: m.contracted_guests ?? 100,
    staffCount: m.staff_count ?? 0,
    staffWeight: m.staff_weight ?? 0.5,
  };
}

export async function saveSettings(s: Settings) {
  const sql = db();
  await sql.begin(async (tx) => {
    for (const [key, value] of [
      ['contracted_guests', s.contractedGuests],
      ['staff_count', s.staffCount],
      ['staff_weight', s.staffWeight],
    ] as const) {
      await tx`insert into wedding.settings (key, value) values (${key}, ${sql.json(value)})
               on conflict (key) do update set value = excluded.value, updated_at = now()`;
    }
  });
}

/** As duas noivas contam como convidadas no contrato do espaço. */
export const COUPLE = 2;

export async function getDashboard() {
  const [r] = await db()<
    {
      sent: number;
      not_sent: number;
      people: number;
      people_sent: number;
      attending: number;
      declined: number;
      pending_sent: number;
      pending_not_sent: number;
    }[]
  >`
    select
      (select count(*) from wedding.invitations where active and sent_at is not null)::int as sent,
      (select count(*) from wedding.invitations where active and sent_at is null)::int as not_sent,
      count(g.*)::int as people,
      count(*) filter (where i.sent_at is not null)::int as people_sent,
      count(*) filter (where g.attendance_status = 'attending')::int as attending,
      count(*) filter (where g.attendance_status = 'declined')::int as declined,
      count(*) filter (where g.attendance_status = 'pending' and i.sent_at is not null)::int as pending_sent,
      count(*) filter (where g.attendance_status = 'pending' and i.sent_at is null)::int as pending_not_sent
    from wedding.guests g join wedding.invitations i on i.id = g.invitation_id and i.active`;
  return r;
}

export async function regenerateCode(id: string): Promise<string> {
  const code = generateInviteCode();
  const sql = db();
  await sql`update wedding.invitations set code_hash = ${hashInviteCode(code)}, code_encrypted = ${encryptInviteCode(code)}
            where id = ${id}`;
  await sql`insert into wedding.rsvp_events (invitation_id, event_type) values (${id}, 'code_regenerated')`;
  return code;
}

export async function listAllGuests() {
  return db()<
    {
      id: string;
      invitation_id: string;
      full_name: string;
      guest_role: 'primary' | 'companion';
      phone: string | null;
      attendance_status: 'pending' | 'attending' | 'declined';
      primary_name: string;
      tag_id: string | null;
      tag_name: string | null;
      tag_color: string | null;
      sent_at: Date | null;
    }[]
  >`
    select g.id, g.invitation_id, g.full_name, g.guest_role, g.phone, g.attendance_status,
           p.full_name as primary_name, i.tag_id, t.name as tag_name, t.color as tag_color, i.sent_at
      from wedding.guests g
      join wedding.invitations i on i.id = g.invitation_id and i.active
      left join wedding.guests p on p.invitation_id = i.id and p.guest_role = 'primary'
      left join wedding.tags t on t.id = i.tag_id
     order by lower(p.full_name), i.id, case g.guest_role when 'primary' then 0 else 1 end, g.created_at`;
}

export async function updateGuest(
  guestId: string,
  data: { fullName: string; phone: string | null; status: 'pending' | 'attending' | 'declined' },
) {
  await db()`
    update wedding.guests
       set full_name = ${data.fullName.trim()},
           phone = ${data.phone},
           attendance_status = ${data.status},
           responded_at = case
             when ${data.status} = 'pending' then null
             when attendance_status <> ${data.status} then now()
             else responded_at end
     where id = ${guestId}`;
}

export async function addCompanion(invitationId: string, fullName: string, phone: string | null) {
  // A vaga acompanha o nome: o convite passa a comportar mais uma pessoa.
  await db().begin(async (tx) => {
    await tx`update wedding.invitations
                set max_guests = least(21, max_guests + 1), invitation_type = 'group', allow_unnamed_companion = false
              where id = ${invitationId}`;
    await tx`insert into wedding.guests (invitation_id, full_name, guest_role, phone)
             values (${invitationId}, ${fullName.trim()}, 'companion', ${phone})`;
  });
}

export async function removeCompanion(guestId: string) {
  await db().begin(async (tx) => {
    const [g] = await tx<{ invitation_id: string }[]>`
      delete from wedding.guests where id = ${guestId} and guest_role = 'companion' returning invitation_id`;
    if (g) {
      await tx`update wedding.invitations
                  set max_guests = greatest(1, max_guests - 1),
                      invitation_type = case when max_guests - 1 <= 1 then 'individual' else 'group' end
                where id = ${g.invitation_id}`;
    }
  });
}

export async function deleteInvitation(id: string) {
  await db()`delete from wedding.invitations where id = ${id}`;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------
export function formatPhone(p: string | null): string {
  if (!p) return '';
  const d = p.startsWith('55') && p.length >= 12 ? p.slice(2) : p;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
}

const STATUS_LABEL = { pending: 'Pendente', attending: 'Confirmado', declined: 'Não comparecerá' } as const;

function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  // Evita injeção de fórmulas ao abrir no Excel/Sheets
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCsv(origin = ''): Promise<string> {
  const invitations = await listInvitations('all');
  const header = ['Tag', 'Convite enviado', 'Convite', 'Código', 'Link do convite', 'Acompanhantes no convite', 'Ativo', 'Convidado', 'Papel', 'Telefone', 'Status', 'Respondido em', 'E-mail', 'Recado / restrições'];
  const lines = [header.join(';')];
  for (const inv of invitations) {
    for (const g of inv.guests) {
      lines.push(
        [
          inv.tag_name ?? '',
          inv.sent_at ? 'Sim' : 'Não',
          inv.label ?? '',
          inv.code ?? '',
          inv.code && origin ? `${origin}/${inv.code}` : '',
          inv.guests.filter((x) => x.guest_role === 'companion').length,
          inv.active ? 'Sim' : 'Não',
          g.full_name,
          g.guest_role === 'primary' ? 'Principal' : 'Acompanhante',
          formatPhone(g.phone),
          STATUS_LABEL[g.attendance_status],
          g.responded_at ? new Date(g.responded_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '',
          inv.contact_email ?? '',
          inv.guest_message ?? '',
        ]
          .map(csvCell)
          .join(';'),
      );
    }
  }
  return '﻿' + lines.join('\r\n');
}
