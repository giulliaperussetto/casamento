import Link from 'next/link';
import { getStats, listInvitations, type StatusFilter } from '@/lib/server/admin';
import {
  addCompanionAction,
  createInvitationAction,
  deleteInvitationAction,
  regenerateCodeAction,
  removeCompanionAction,
  toggleActiveAction,
  updateGuestAction,
  updateInvitationAction,
} from '../actions';
import { ConfirmSubmit, CopyButton, TypeFields } from './ClientBits';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'attending', label: 'Confirmados' },
  { key: 'declined', label: 'Recusas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'inactive', label: 'Inativos' },
];

const STATUS_LABEL = { pending: 'Pendente', attending: 'Confirmado', declined: 'Não vai' } as const;

function fmt(d: Date | string | null) {
  return d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : '—';
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; ok?: string; error?: string; highlight?: string }>;
}) {
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.status)?.key ?? 'all') as StatusFilter;
  const q = (sp.q ?? '').slice(0, 80);
  const [stats, invitations] = await Promise.all([getStats(), listInvitations(filter, q)]);

  return (
    <>
      {sp.ok && <p className="adm-alert adm-alert--ok" role="status">{sp.ok}</p>}
      {sp.error && <p className="adm-alert adm-alert--error" role="alert">{sp.error}</p>}

      <section className="adm-stats" aria-label="Resumo">
        <div><span>{stats.attending}</span>Confirmados</div>
        <div><span>{stats.declined}</span>Recusas</div>
        <div><span>{stats.pending}</span>Pendentes</div>
        <div><span>{stats.guests}</span>Convidados</div>
        <div><span>{stats.active}<small>/{stats.invitations}</small></span>Convites ativos</div>
      </section>
      <p className="adm-muted adm-small">Totais consideram apenas convites ativos.</p>

      <div className="adm-grid">
        <section className="adm-panel">
          <h2>Novo convite</h2>
          <form action={createInvitationAction} className="adm-form">
            <TypeFields />
            <label>
              Nome do convidado principal
              <input name="primaryName" required minLength={2} maxLength={120} />
            </label>
            <label>
              Identificação interna (opcional)
              <input name="label" maxLength={120} placeholder="Ex.: Família Souza, colegas do trabalho" />
            </label>
            <button className="adm-btn adm-btn--primary">Criar convite e gerar código</button>
          </form>
          <p className="adm-muted adm-small">
            O código é gerado automaticamente, é único e fica armazenado apenas como hash para validação. Para importar uma
            lista completa, use <code>npm run guests:import</code>.
          </p>
        </section>

        <section className="adm-panel adm-panel--list">
          <div className="adm-toolbar">
            <nav className="adm-tabs" aria-label="Filtrar por status">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={{ pathname: '/admin', query: { status: f.key, ...(q ? { q } : {}) } }}
                  aria-current={filter === f.key ? 'page' : undefined}
                >
                  {f.label}
                </Link>
              ))}
            </nav>
            <form className="adm-search" role="search">
              <input type="hidden" name="status" value={filter} />
              <input name="q" defaultValue={q} placeholder="Buscar por nome" aria-label="Buscar por nome" />
              <button className="adm-btn adm-btn--small">Buscar</button>
            </form>
            <a className="adm-btn adm-btn--small" href="/api/admin/export">Exportar CSV</a>
          </div>

          {invitations.length === 0 && <p className="adm-muted">Nenhum convite encontrado.</p>}

          <ul className="adm-list">
            {invitations.map((inv) => (
              <li key={inv.id} id={inv.id} className={`adm-inv${inv.active ? '' : ' is-inactive'}${sp.highlight === inv.id ? ' is-highlight' : ''}`}>
                <div className="adm-inv__head">
                  <div>
                    <span className="adm-badge">{inv.invitation_type === 'couple' ? 'Casal · até 2' : 'Individual · 1'}</span>
                    {!inv.active && <span className="adm-badge adm-badge--off">Inativo</span>}
                    {inv.label && <strong className="adm-inv__label">{inv.label}</strong>}
                  </div>
                  <div className="adm-code">
                    <code>{inv.code ?? '(código indisponível)'}</code>
                    {inv.code && <CopyButton value={inv.code} />}
                  </div>
                </div>

                <table className="adm-table">
                  <thead>
                    <tr><th>Convidado</th><th>Status</th><th>Respondido</th><th><span className="sr-only">Ações</span></th></tr>
                  </thead>
                  <tbody>
                    {inv.guests.map((g) => (
                      <tr key={g.id}>
                        <td colSpan={4}>
                          <form action={updateGuestAction} className="adm-guest">
                            <input type="hidden" name="guestId" value={g.id} />
                            <input type="hidden" name="invitationId" value={inv.id} />
                            <label className="adm-guest__name">
                              <span className="adm-muted adm-small">
                                {g.guest_role === 'primary' ? 'Principal' : g.name_locked ? 'Acompanhante' : 'Acompanhante (informado pelo convidado)'}
                              </span>
                              <input name="fullName" defaultValue={g.full_name} required minLength={2} maxLength={120} />
                            </label>
                            <select name="status" defaultValue={g.attendance_status} aria-label="Status">
                              {(['pending', 'attending', 'declined'] as const).map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                              ))}
                            </select>
                            <span className={`adm-status adm-status--${g.attendance_status}`}>{fmt(g.responded_at)}</span>
                            <span className="adm-guest__actions">
                              <button className="adm-btn adm-btn--small">Salvar</button>
                              {g.guest_role === 'companion' && (
                                <ConfirmSubmit
                                  message="Remover este acompanhante?"
                                  className="adm-btn adm-btn--small adm-btn--danger"
                                  formAction={removeCompanionAction}
                                >
                                  Remover
                                </ConfirmSubmit>
                              )}
                            </span>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {inv.invitation_type === 'couple' && inv.guests.length < inv.max_guests && (
                  <form action={addCompanionAction} className="adm-inline">
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <input name="fullName" placeholder="Cadastrar nome do acompanhante" minLength={2} maxLength={120} required aria-label="Nome do acompanhante" />
                    <button className="adm-btn adm-btn--small">Adicionar</button>
                  </form>
                )}

                <details className="adm-more">
                  <summary>Mais opções</summary>
                  <div className="adm-more__body">
                    <form action={updateInvitationAction} className="adm-inline">
                      <input type="hidden" name="id" value={inv.id} />
                      <input name="label" defaultValue={inv.label ?? ''} placeholder="Identificação interna" maxLength={120} aria-label="Identificação interna" />
                      {inv.invitation_type === 'couple' && (
                        <label className="adm-check">
                          <input type="checkbox" name="allowUnnamedCompanion" defaultChecked={inv.allow_unnamed_companion} />
                          Convidado pode informar acompanhante
                        </label>
                      )}
                      <button className="adm-btn adm-btn--small">Salvar</button>
                    </form>
                    <div className="adm-inline">
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <input type="hidden" name="active" value={String(!inv.active)} />
                        <button className="adm-btn adm-btn--small">{inv.active ? 'Desativar convite' : 'Ativar convite'}</button>
                      </form>
                      <form action={regenerateCodeAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <ConfirmSubmit message="Gerar um novo código? O código atual deixará de funcionar.">Gerar novo código</ConfirmSubmit>
                      </form>
                      <form action={deleteInvitationAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <ConfirmSubmit message="Excluir este convite e todas as respostas? Esta ação não pode ser desfeita." className="adm-btn adm-btn--small adm-btn--danger">
                          Excluir
                        </ConfirmSubmit>
                      </form>
                    </div>
                    <p className="adm-muted adm-small">Criado em {fmt(inv.created_at)} · Atualizado em {fmt(inv.updated_at)}</p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
