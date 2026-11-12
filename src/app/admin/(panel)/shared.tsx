import { headers } from 'next/headers';
import { wedding } from '@/config/wedding';

export type GuestStatus = 'pending' | 'attending' | 'declined';

export const STATUS_LABEL: Record<GuestStatus, string> = {
  pending: 'Pendente',
  attending: 'Confirmado',
  declined: 'Recusou',
};

export async function getOrigin() {
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
}

export function inviteLink(origin: string, code: string) {
  return `${origin}/${code}`;
}

export function whatsappHref(origin: string, code: string, name: string) {
  return `https://wa.me/?text=${encodeURIComponent(
    wedding.rsvp.whatsappMessage.replace('{nome}', name.split(' ')[0]).replace('{link}', inviteLink(origin, code)),
  )}`;
}

export function formatPhone(p: string | null): string {
  if (!p) return '';
  const d = p.startsWith('55') && p.length >= 12 ? p.slice(2) : p;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
}

export function fmtDate(d: Date | string | null) {
  return d
    ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
    : '—';
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  return (
    <>
      {ok && (
        <p className="adm-alert adm-alert--ok" role="status">
          {ok}
        </p>
      )}
      {error && (
        <p className="adm-alert adm-alert--error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export function TagChip({ name, color }: { name: string | null; color: string | null }) {
  if (!name) return <span className="adm-tag adm-tag--empty">Sem tag</span>;
  return (
    <span className="adm-tag" style={{ ['--tag' as string]: color ?? '#8A4B5E' }}>
      {name}
    </span>
  );
}

/** Uma bolinha por pessoa: prata = pendente, verde = confirmado, vermelho = recusou. "–" = convite não enviado. */
export function StatusDots({ statuses, sent }: { statuses: GuestStatus[]; sent: boolean }) {
  const allPending = statuses.every((s) => s === 'pending');
  if (!sent && allPending) {
    return (
      <span className="adm-dots adm-dots--none" title="Convite ainda não enviado">
        –
      </span>
    );
  }
  return (
    <span className="adm-dots" aria-label={statuses.map((s) => STATUS_LABEL[s]).join(', ')}>
      {statuses.map((s, i) => (
        <span key={i} className={`adm-dot adm-dot--${s}`} title={STATUS_LABEL[s]} />
      ))}
    </span>
  );
}
