import Link from 'next/link';
import { listInvitations, listTags, type AdminInvitation } from '@/lib/server/admin';
import {
  addCompanionAction,
  deleteInvitationAction,
  regenerateCodeAction,
  removeCompanionAction,
  setSentAction,
  toggleActiveAction,
  updateGuestAction,
  updateInvitationAction,
} from '../../actions';
import { AutoSubmitSelect, ConfirmSubmit, CopyButton, WhatsAppButton } from '../ClientBits';
import { Flash, StatusDots, TagChip, fmtDate, formatPhone, getOrigin, inviteLink, whatsappHref } from '../shared';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'not_sent', label: 'Não enviados' },
  { key: 'sent', label: 'Enviados' },
  { key: 'pending', label: 'Com pendentes' },
  { key: 'attending', label: 'Com confirmados' },
  { key: 'declined', label: 'Com recusas' },
  { key: 'inactive', label: 'Inativos' },
] as const;

function matches(inv: AdminInvitation, status: string) {
  const st = inv.guests.map((g) => g.attendance_status);
  switch (status) {
    case 'not_sent':
      return inv.active && !inv.sent_at;
    case 'sent':
      return inv.active && !!inv.sent_at;
    case 'pending':
      return inv.active && st.includes('pending');
    case 'attending':
      return inv.active && st.includes('attending');
    case 'declined':
      return inv.active && st.includes('declined');
    case 'inactive':
      return !inv.active;
    default:
      return true;
  }
}

export default async function ConvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; status?: string; ok?: string; error?: string; open?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const tag = sp.tag ?? '';
  const status = STATUS_FILTERS.some((f) => f.key === sp.status) ? sp.status! : 'all';
  const [all, tags, origin] = await Promise.all([listInvitations('all', q), listTags(), getOrigin()]);
  const invitations = all
    .filter((i) => (tag === 'none' ? !i.tag_id : tag ? i.tag_id === tag : true))
    .filter((i) => matches(i, status))
    .sort((a, b) => {
      const pa = a.guests.find((g) => g.guest_role === 'primary')?.full_name ?? '';
      const pb = b.guests.find((g) => g.guest_role === 'primary')?.full_name ?? '';
      return pa.localeCompare(pb, 'pt-BR');
    });
  const returnTo = `/admin/convites?${new URLSearchParams({ ...(q ? { q } : {}), ...(tag ? { tag } : {}), status })}`;

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="adm-title">
        <h1>Convites</h1>
        <span className="adm-muted">{invitations.length} convite{invitations.length === 1 ? '' : 's'}</span>
      </div>

      <form className="adm-filters" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar por nome" aria-label="Buscar por nome" />
        <AutoSubmitSelect name="tag" defaultValue={tag} aria-label="Filtrar por tag">
          <option value="">Todas as tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value="none">Sem tag</option>
        </AutoSubmitSelect>
        <AutoSubmitSelect name="status" defaultValue={status} aria-label="Filtrar por status">
          {STATUS_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </AutoSubmitSelect>
        <button className="adm-btn">Buscar</button>
        <a className="adm-btn adm-btn--ghost-dark" href="/api/admin/export">
          Exportar CSV
        </a>
      </form>

      <p className="adm-legend adm-small">
        <span className="adm-dot adm-dot--pending" /> Pendente <span className="adm-dot adm-dot--attending" /> Confirmado{' '}
        <span className="adm-dot adm-dot--declined" /> Recusou <span className="adm-dots--none">–</span> Não enviado
      </p>

      {invitations.length === 0 && <p className="adm-empty">Nenhum convite encontrado.</p>}

      <ul className="adm-invs">
        {invitations.map((inv) => {
          const primary = inv.guests.find((g) => g.guest_role === 'primary');
          const companions = inv.guests.filter((g) => g.guest_role === 'companion');
          return (
            <li key={inv.id} id={inv.id}>
              <details className={`adm-inv${inv.active ? '' : ' is-inactive'}`} open={sp.open === inv.id}>
                <summary className="adm-inv__sum">
                  <span className="adm-inv__who">
                    <strong>{primary?.full_name ?? '—'}</strong>
                    {companions.length > 0 && <span className="adm-muted adm-small">+{companions.length}</span>}
                  </span>
                  <TagChip name={inv.tag_name} color={inv.tag_color} />
                  <code className="adm-inv__code">{inv.code ?? '—'}</code>
                  <StatusDots statuses={inv.guests.map((g) => g.attendance_status)} sent={!!inv.sent_at} />
                  {inv.code && inv.active ? (
                    <WhatsAppButton href={whatsappHref(origin, inv.code, primary?.full_name ?? '')} invitationId={inv.id} compact />
                  ) : (
                    <span />
                  )}
                  <svg className="adm-inv__chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </summary>

                <div className="adm-inv__body">
                  {!inv.active && <p className="adm-alert adm-alert--error">Convite inativo: o código não funciona no site.</p>}

                  {inv.code && (
                    <div className="adm-link">
                      <a href={inviteLink(origin, inv.code)} target="_blank" rel="noopener noreferrer" className="adm-link__url">
                        {inviteLink(origin, inv.code).replace(/^https?:\/\//, '')}
                      </a>
                      <CopyButton value={inviteLink(origin, inv.code)} label="Copiar link" />
                      <CopyButton value={inv.code} label="Copiar código" />
                      <WhatsAppButton href={whatsappHref(origin, inv.code, primary?.full_name ?? '')} invitationId={inv.id} />
                    </div>
                  )}

                  <div className="adm-small adm-muted adm-sent">
                    {inv.sent_at ? `Enviado em ${fmtDate(inv.sent_at)}` : 'Ainda não enviado.'}{' '}
                    <form action={setSentAction} className="adm-inline-form">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="sent" value={String(!inv.sent_at)} />
                      <button className="adm-linkbtn">{inv.sent_at ? 'Marcar como não enviado' : 'Marcar como enviado'}</button>
                    </form>
                  </div>

                  <div className="adm-people">
                    {inv.guests.map((g) => (
                      <form key={g.id} action={updateGuestAction} className="adm-person">
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <input type="hidden" name="guestId" value={g.id} />
                        <input type="hidden" name="invitationId" value={inv.id} />
                        <span className={`adm-dot adm-dot--${g.attendance_status}`} aria-hidden="true" />
                        <label className="adm-person__name">
                          <span>{g.guest_role === 'primary' ? 'Convidado principal' : 'Acompanhante'}</span>
                          <input name="fullName" defaultValue={g.full_name} required minLength={2} maxLength={120} />
                        </label>
                        <label className="adm-person__phone">
                          <span>Telefone</span>
                          <input name="phone" defaultValue={formatPhone(g.phone)} inputMode="tel" maxLength={20} placeholder="(11) 90000-0000" />
                        </label>
                        <label className="adm-person__status">
                          <span>Status</span>
                          <select name="status" defaultValue={g.attendance_status}>
                            <option value="pending">Pendente</option>
                            <option value="attending">Confirmado</option>
                            <option value="declined">Recusou</option>
                          </select>
                        </label>
                        <span className="adm-person__actions">
                          <button className="adm-btn adm-btn--small">Salvar</button>
                          {g.guest_role === 'companion' && (
                            <ConfirmSubmit message="Remover este acompanhante?" className="adm-btn adm-btn--small adm-btn--danger" formAction={removeCompanionAction}>
                              Remover
                            </ConfirmSubmit>
                          )}
                        </span>
                        <span className="adm-person__meta adm-small adm-muted">Respondeu em {fmtDate(g.responded_at)}</span>
                      </form>
                    ))}
                  </div>

                  <form action={addCompanionAction} className="adm-add">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <input name="fullName" placeholder="Adicionar acompanhante" minLength={2} maxLength={120} required aria-label="Nome do acompanhante" />
                    <input name="phone" placeholder="Telefone (opcional)" inputMode="tel" maxLength={20} aria-label="Telefone do acompanhante" />
                    <button className="adm-btn adm-btn--small">Adicionar</button>
                  </form>

                  {inv.guest_message && (
                    <div className="adm-contact">
                      {inv.guest_message && (
                        <p>
                          <span className="adm-muted">Recado:</span> “{inv.guest_message}”
                        </p>
                      )}
                    </div>
                  )}

                  <form action={updateInvitationAction} className="adm-edit">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="id" value={inv.id} />
                    <label>
                      <span>Tag</span>
                      <select name="tagId" defaultValue={inv.tag_id ?? ''}>
                        <option value="">Sem tag</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Observação interna</span>
                      <input name="label" defaultValue={inv.label ?? ''} maxLength={120} placeholder="Ex.: tios da Giullia" />
                    </label>
                    <button className="adm-btn adm-btn--small">Salvar</button>
                  </form>

                  <div className="adm-danger">
                    <form action={toggleActiveAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="active" value={String(!inv.active)} />
                      <button className="adm-linkbtn">{inv.active ? 'Desativar convite' : 'Reativar convite'}</button>
                    </form>
                    <form action={regenerateCodeAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="id" value={inv.id} />
                      <ConfirmSubmit message="Gerar um novo código? O código e o link atuais deixarão de funcionar." className="adm-linkbtn">
                        Gerar novo código
                      </ConfirmSubmit>
                    </form>
                    <form action={deleteInvitationAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="id" value={inv.id} />
                      <ConfirmSubmit message="Excluir este convite e todas as respostas? Esta ação não pode ser desfeita." className="adm-linkbtn adm-linkbtn--danger">
                        Excluir convite
                      </ConfirmSubmit>
                    </form>
                    <span className="adm-muted adm-small">Criado em {fmtDate(inv.created_at)}</span>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <p className="adm-small adm-muted">
        Precisa de mais tags? <Link href="/admin/tags">Gerenciar tags</Link>
      </p>
    </>
  );
}
