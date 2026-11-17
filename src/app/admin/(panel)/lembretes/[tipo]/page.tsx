import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  REMINDERS,
  TEMPLATE_LABEL,
  TEMPLATE_VARS,
  daysUntil,
  getReminderSettings,
  listTargets,
  renderMessage,
  whatsappLink,
  type ReminderKind,
  type ReminderTarget,
} from '@/lib/server/reminders';
import { saveTemplateAction, setReminderSentAction } from '../../../actions';
import { WhatsAppButton } from '../../ClientBits';
import { Flash, TagChip, fmtDate, formatPhone, getOrigin } from '../../shared';
import { tone, whenText } from '../shared';

const VIEWS = [
  { key: 'enviar', label: 'A enviar' },
  { key: 'enviados', label: 'Já enviados' },
  { key: 'todos', label: 'Todos' },
] as const;

export default async function LembretePage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ ver?: string; ok?: string; error?: string }>;
}) {
  const { tipo } = await params;
  if (!(tipo in REMINDERS)) notFound();
  const kind = tipo as ReminderKind;
  const info = REMINDERS[kind];
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.key === sp.ver) ? sp.ver! : 'enviar';

  let targets: ReminderTarget[];
  try {
    targets = await listTargets(kind);
  } catch (err) {
    if ((err as { code?: string }).code === '42P01') {
      return (
        <p className="adm-alert adm-alert--error">
          Falta um passo no banco: rode o arquivo <strong>0008_reminders.sql</strong> no SQL Editor do Supabase e recarregue esta página.
        </p>
      );
    }
    throw err;
  }
  const [settings, origin] = await Promise.all([getReminderSettings(), getOrigin()]);

  const sent = targets.filter((t) => t.reminded_at).length;
  const summary = {
    days: daysUntil(info.date),
    date: info.date,
    open: Date.now() < info.endsAt.getTime(),
    toSend: targets.length - sent,
  };
  const shown = targets.filter((t) => (view === 'enviar' ? !t.reminded_at : view === 'enviados' ? !!t.reminded_at : true));
  const groups =
    kind === 'prazo'
      ? [{ title: 'Ainda não responderam', rows: shown }]
      : [
          { title: 'Madrinhas e padrinhos', rows: shown.filter((t) => t.role) },
          { title: 'Convidados confirmados', rows: shown.filter((t) => !t.role) },
        ];
  const returnTo = `/admin/lembretes/${kind}?ver=${view}`;
  const missing = kind !== 'prazo' && (!settings.padrinhosArrival || !settings.assessoria);

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <p className="adm-small">
        <Link href="/admin/lembretes">← Lembretes</Link>
      </p>
      <div className="adm-title">
        <h1>{info.title}</h1>
        <span className={`adm-rem-badge adm-rem-badge--${tone(summary)}`}>{whenText(summary)}</span>
      </div>
      <p className="adm-muted" style={{ marginTop: -8 }}>
        {info.audience}
      </p>

      {missing && (
        <p className="adm-alert adm-alert--warn">
          Antes de enviar, preencha o {!settings.assessoria ? 'contato da assessoria' : ''}
          {!settings.assessoria && !settings.padrinhosArrival ? ' e o ' : ''}
          {!settings.padrinhosArrival ? 'horário de chegada de madrinhas e padrinhos' : ''} na{' '}
          <Link href="/admin/lembretes">página de Lembretes</Link>.
        </p>
      )}

      <nav className="adm-tabs" aria-label="Filtrar">
        {VIEWS.map((v) => {
          const n = v.key === 'enviar' ? targets.length - sent : v.key === 'enviados' ? sent : targets.length;
          return (
            <Link key={v.key} href={`/admin/lembretes/${kind}?ver=${v.key}`} aria-current={view === v.key ? 'page' : undefined}>
              {v.label} <span>{n}</span>
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 && (
        <p className="adm-empty">
          {view === 'enviar' && targets.length > 0 ? 'Todos já receberam este lembrete.' : 'Ninguém nesta lista por enquanto.'}
        </p>
      )}

      {groups
        .filter((g) => g.rows.length > 0)
        .map((g) => (
          <section key={g.title} className="adm-remlist">
            <h2>
              {g.title} <span className="adm-muted">({g.rows.length})</span>
            </h2>
            <ul>
              {g.rows.map((t) => {
                const text = renderMessage(kind, t, settings, origin);
                return (
                  <li key={t.invitation_id} className={`adm-remrow${t.reminded_at ? ' is-sent' : ''}`}>
                    <div className="adm-remrow__who">
                      <strong>{t.primary_name}</strong>
                      <span className="adm-small adm-muted">
                        {kind === 'prazo'
                          ? `${t.people} pessoa${t.people === 1 ? '' : 's'} no convite`
                          : `${t.attending} confirmado${t.attending === 1 ? '' : 's'}`}
                        {' · '}
                        {t.phone ? formatPhone(t.phone) : 'sem telefone: escolha o contato no WhatsApp'}
                      </span>
                    </div>
                    <TagChip name={t.tag_name} color={t.tag_color} />
                    <span className="adm-small adm-muted adm-remrow__status">
                      {t.reminded_at ? `Enviado em ${fmtDate(t.reminded_at)}` : 'Não enviado'}
                    </span>
                    <div className="adm-remrow__actions">
                      <WhatsAppButton
                        href={whatsappLink(t.phone, text)}
                        invitationId={t.invitation_id}
                        reminder={kind}
                        label={t.reminded_at ? 'Enviar de novo' : 'Enviar lembrete'}
                      />
                      <form action={setReminderSentAction} className="adm-inline-form">
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <input type="hidden" name="id" value={t.invitation_id} />
                        <input type="hidden" name="kind" value={kind} />
                        <input type="hidden" name="sent" value={String(!t.reminded_at)} />
                        <button className="adm-linkbtn">{t.reminded_at ? 'Desmarcar' : 'Marcar como enviado'}</button>
                      </form>
                    </div>
                    <details className="adm-remrow__preview">
                      <summary>Ver mensagem</summary>
                      <pre>{text}</pre>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      <section className="adm-panel">
        <h2>Mensagens deste lembrete</h2>
        <p className="adm-muted adm-small">
          Palavras entre chaves são trocadas automaticamente para cada convite:{' '}
          {TEMPLATE_VARS.filter((v) => kind !== 'prazo' || !['{papel}', '{traje}', '{chegada_padrinhos}'].includes(v.key)).map((v, i) => (
            <span key={v.key}>
              {i > 0 && ' · '}
              <code>{v.key}</code> {v.desc}
            </span>
          ))}
        </p>
        {info.templates.map((key) => (
          <form key={key} action={saveTemplateAction} className="adm-template">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="key" value={key} />
            <label>
              <strong>{TEMPLATE_LABEL[key]}</strong>
              <textarea name="text" rows={14} defaultValue={settings.templates[key]} maxLength={3000} />
            </label>
            <div className="adm-template__actions">
              <button className="adm-btn adm-btn--primary adm-btn--small">Salvar mensagem</button>
              <button className="adm-btn adm-btn--small" name="reset" value="true">
                Voltar ao texto original
              </button>
            </div>
          </form>
        ))}
      </section>
    </>
  );
}
