import Link from 'next/link';
import { COUPLE, getDashboard, getSettings } from '@/lib/server/admin';
import { saveSettingsAction } from '../actions';
import { Flash } from './shared';
import { REMINDERS, getReminderSummaries } from '@/lib/server/reminders';
import { whenText } from './lembretes/shared';

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [d, s, rems] = await Promise.all([getDashboard(), getSettings(), getReminderSummaries()]);
  // Lembretes que precisam de atenção: faltam 7 dias ou menos e ainda há gente para lembrar.
  const dueRems = (rems ?? []).filter((r) => r.open && r.toSend > 0 && r.days <= 7);
  const nextRem = (rems ?? []).filter((r) => r.open && r.toSend > 0 && r.days > 7).sort((a, b) => a.days - b.days)[0];

  const staffEquivalent = s.staffCount * s.staffWeight;
  // Ocupação real: quem já confirmou + noivas + staff.
  const occupied = d.attending + COUPLE + staffEquivalent;
  const over = occupied - s.contractedGuests;
  // Planejamento: pessoas em convites enviados (exceto recusas) + noivas + staff.
  const committed = d.people_sent - (d.declined) + COUPLE + staffEquivalent;
  const remainingToInvite = s.contractedGuests - committed;
  const pct = Math.min(100, Math.round((occupied / s.contractedGuests) * 100));

  const cards = [
    { label: 'Convites enviados', value: d.sent, href: '/admin/convites?status=sent' },
    { label: 'Convites não enviados', value: d.not_sent, href: '/admin/convites?status=not_sent' },
    { label: 'Confirmados', value: d.attending, tone: 'green', href: '/admin/lista?status=attending' },
    { label: 'Pendentes', value: d.pending_sent, tone: 'silver', hint: 'de convites enviados', href: '/admin/lista?status=pending' },
    { label: 'Recusados', value: d.declined, tone: 'red', href: '/admin/lista?status=declined' },
    { label: 'Total de convidados', value: d.people, hint: 'em todos os convites', href: '/admin/lista' },
  ];

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="adm-hello">
        <h1>Olá, noivas!</h1>
        <p className="adm-muted">Um resumo de como estão os convites e as confirmações.</p>
      </div>

      <section className="adm-cards" aria-label="Resumo">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`adm-card${c.tone ? ` adm-card--${c.tone}` : ''}`}>
            <span className="adm-card__value">{c.value}</span>
            <span className="adm-card__label">{c.label}</span>
            {c.hint && <span className="adm-card__hint">{c.hint}</span>}
          </Link>
        ))}
      </section>

      {rems === null && (
        <p className="adm-alert adm-alert--warn">
          Para usar os lembretes, rode o arquivo <strong>0008_reminders.sql</strong> no SQL Editor do Supabase.
        </p>
      )}
      {dueRems.map((r) => (
        <Link key={r.kind} href={`/admin/lembretes/${r.kind}`} className={`adm-remalert${r.days <= 0 ? ' is-now' : ''}`}>
          <span className="adm-remalert__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </span>
          <span>
            <strong>
              {REMINDERS[r.kind].title}: {whenText(r).toLowerCase()}
            </strong>
            <span className="adm-small">
              {r.toSend} convite{r.toSend === 1 ? '' : 's'} para lembrar{r.sent > 0 ? ` · ${r.sent} já enviado${r.sent === 1 ? '' : 's'}` : ''}. Abrir lista →
            </span>
          </span>
        </Link>
      ))}
      {dueRems.length === 0 && nextRem && (
        <p className="adm-small adm-muted adm-nextrem">
          Próximo lembrete: <Link href={`/admin/lembretes/${nextRem.kind}`}>{REMINDERS[nextRem.kind].short}</Link>,{' '}
          {whenText(nextRem).replace('Disparar', 'disparar')}.
        </p>
      )}

      <section className={`adm-capacity${over > 0 ? ' is-over' : over >= -5 ? ' is-near' : ''}`} aria-label="Capacidade">
        <div className="adm-capacity__head">
          <div>
            <h2>
              {over > 0
                ? `Atenção: ${fmt(over)} acima do contratado`
                : over >= -5
                  ? `Quase lá: faltam ${fmt(-over)} para o limite`
                  : 'Dentro do contratado'}
            </h2>
            <p className="adm-muted adm-small">
              Confirmados ({d.attending}) + noivas ({COUPLE}) + staff ({fmt(staffEquivalent)}) = <strong>{fmt(occupied)}</strong> de{' '}
              {s.contractedGuests} contratados
            </p>
          </div>
          <span className="adm-capacity__pct">{pct}%</span>
        </div>
        <div className="adm-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="adm-capacity__plan">
          Considerando os convites já enviados (sem as recusas), noivas e staff: <strong>{fmt(committed)}</strong> lugares
          comprometidos.{' '}
          {remainingToInvite >= 0 ? (
            <>
              Ainda dá para chamar <strong>{fmt(remainingToInvite)}</strong> convidado{remainingToInvite === 1 ? '' : 's'}.
            </>
          ) : (
            <>
              Os convites enviados já passam <strong>{fmt(-remainingToInvite)}</strong> do contratado (o alerta acima só considera
              quem confirmou).
            </>
          )}
        </p>
      </section>

      <section className="adm-panel adm-settings">
        <h2>Contrato e staff</h2>
        <form action={saveSettingsAction} className="adm-settings__form">
          <input type="hidden" name="returnTo" value="/admin" />
          <label>
            Convidados contratados
            <input name="contractedGuests" type="number" min={1} defaultValue={s.contractedGuests} inputMode="numeric" />
          </label>
          <label>
            Staff (fotógrafo, barman…)
            <input name="staffCount" type="number" min={0} defaultValue={s.staffCount} inputMode="numeric" />
          </label>
          <label>
            Cada staff conta como
            <select name="staffWeight" defaultValue={String(s.staffWeight)}>
              <option value="0.5">Meio convidado (meia)</option>
              <option value="1">Um convidado (inteira)</option>
            </select>
          </label>
          <button className="adm-btn adm-btn--primary">Salvar</button>
        </form>
        <p className="adm-muted adm-small">
          {s.staffCount} staff × {s.staffWeight === 1 ? 'inteira' : 'meia'} = {fmt(staffEquivalent)} convidado
          {staffEquivalent === 1 ? '' : 's'}. As noivas contam como {COUPLE}.
        </p>
      </section>

      <section className="adm-shortcuts">
        <Link href="/admin/lista" className="adm-shortcut">
          <strong>Lista geral</strong>
          <span>Todos os convidados, um por linha, com telefone e troca rápida de status.</span>
        </Link>
        <Link href="/admin/novo" className="adm-shortcut">
          <strong>Novo convite</strong>
          <span>Crie um convite, defina a tag e os acompanhantes.</span>
        </Link>
        <Link href="/admin/convites" className="adm-shortcut">
          <strong>Convites</strong>
          <span>Visão por convite: link, WhatsApp, dados e respostas.</span>
        </Link>
      </section>
    </>
  );
}
