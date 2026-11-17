import Link from 'next/link';
import { REMINDERS, getReminderSettings, getReminderSummaries } from '@/lib/server/reminders';
import { saveReminderInfoAction } from '../../actions';
import { Flash } from '../shared';
import { tone, whenText } from './shared';

export default async function LembretesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const summaries = await getReminderSummaries();

  if (!summaries) {
    return (
      <>
        <div className="adm-title">
          <h1>Lembretes</h1>
        </div>
        <p className="adm-alert adm-alert--error">
          Falta um passo no banco: rode o arquivo <strong>0008_reminders.sql</strong> no SQL Editor do Supabase e recarregue esta página.
        </p>
      </>
    );
  }
  const s = await getReminderSettings();

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="adm-title">
        <h1>Lembretes</h1>
        <span className="adm-muted">Mensagens prontas para enviar pelo seu WhatsApp, um clique por convite.</span>
      </div>

      <section className="adm-rems" aria-label="Lembretes">
        {summaries.map((r) => {
          const info = REMINDERS[r.kind];
          return (
            <Link key={r.kind} href={`/admin/lembretes/${r.kind}`} className={`adm-rem adm-rem--${tone(r)}`}>
              <span className="adm-rem__when">{whenText(r)}</span>
              <strong className="adm-rem__title">{info.title}</strong>
              <span className="adm-rem__aud">{info.audience}</span>
              <span className="adm-rem__nums">
                <span>
                  <b>{r.toSend}</b> a enviar
                </span>
                <span>
                  <b>{r.sent}</b> enviado{r.sent === 1 ? '' : 's'}
                </span>
              </span>
              <span className="adm-rem__go">Abrir lista →</span>
            </Link>
          );
        })}
      </section>

      <section className="adm-panel">
        <h2>Informações usadas nas mensagens</h2>
        {(!s.padrinhosArrival || !s.assessoria) && (
          <p className="adm-alert adm-alert--warn">
            Preencha {!s.padrinhosArrival && !s.assessoria ? 'o horário de chegada e o contato da assessoria' : !s.assessoria ? 'o contato da assessoria' : 'o horário de chegada de madrinhas e padrinhos'}{' '}
            antes de disparar os lembretes de 1 semana e da véspera.
          </p>
        )}
        <form action={saveReminderInfoAction} className="adm-settings__form adm-settings__form--wide">
          <input type="hidden" name="returnTo" value="/admin/lembretes" />
          <label>
            Chegada de madrinhas e padrinhos
            <input name="padrinhosArrival" defaultValue={s.padrinhosArrival} placeholder="Ex.: 14h30" maxLength={80} />
          </label>
          <label>
            Contato da assessoria
            <input name="assessoria" defaultValue={s.assessoria} placeholder="Ex.: Ana (Assessoria X) – (11) 99999-9999" maxLength={200} />
          </label>
          <label>
            Traje das madrinhas
            <input name="trajeMadrinha" defaultValue={s.trajeMadrinha} maxLength={200} />
          </label>
          <label>
            Traje dos padrinhos
            <input name="trajePadrinho" defaultValue={s.trajePadrinho} maxLength={200} />
          </label>
          <button className="adm-btn adm-btn--primary">Salvar</button>
        </form>
        <p className="adm-muted adm-small">
          Quem é madrinha ou padrinho vem da tag do convite: tags com &quot;madrinha&quot; ou &quot;padrinho&quot; no nome (como
          &quot;Madrinhas&quot; e &quot;Padrinhos&quot;) recebem a mensagem própria, com horário de chegada e traje.
        </p>
      </section>

      <section className="adm-panel adm-small adm-muted">
        <h2>Como funciona</h2>
        <p>
          Cada lista mostra só quem deve receber aquele lembrete. Ao clicar em <strong>Enviar lembrete</strong>, o seu WhatsApp
          abre com a mensagem pronta e o convite já fica marcado como lembrado. Quem respondeu &quot;não vou&quot; nunca aparece
          nos lembretes. Os textos podem ser editados dentro de cada lembrete.
        </p>
      </section>
    </>
  );
}
