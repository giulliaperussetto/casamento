import { listAllGuests, listTags } from '@/lib/server/admin';
import { AutoSubmitSelect, QuickStatus } from '../ClientBits';
import { TagChip, formatPhone } from '../shared';

/** Lista geral: uma pessoa por linha, para contato rápido e troca de status (assessoria). */
export default async function ListaGeralPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().toLowerCase().slice(0, 80);
  const tag = sp.tag ?? '';
  const status = ['pending', 'attending', 'declined'].includes(sp.status ?? '') ? sp.status! : '';
  const [guests, tags] = await Promise.all([listAllGuests(), listTags()]);
  const rows = guests
    .filter((g) => (tag === 'none' ? !g.tag_id : tag ? g.tag_id === tag : true))
    .filter((g) => (status ? g.attendance_status === status : true))
    .filter((g) => (q ? g.full_name.toLowerCase().includes(q) || g.primary_name.toLowerCase().includes(q) : true));

  const count = (s: string) => rows.filter((r) => r.attendance_status === s).length;

  return (
    <>
      <div className="adm-title">
        <h1>Lista geral</h1>
        <span className="adm-muted">
          {rows.length} pessoa{rows.length === 1 ? '' : 's'} · {count('attending')} confirmada{count('attending') === 1 ? '' : 's'} ·{' '}
          {count('pending')} pendente{count('pending') === 1 ? '' : 's'} · {count('declined')} recusa{count('declined') === 1 ? '' : 's'}
        </span>
      </div>

      <form className="adm-filters" role="search">
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Buscar por nome" aria-label="Buscar por nome" />
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
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="attending">Confirmados</option>
          <option value="declined">Recusados</option>
        </AutoSubmitSelect>
        <button className="adm-btn">Buscar</button>
      </form>

      {rows.length === 0 && <p className="adm-empty">Ninguém encontrado.</p>}

      <div className="adm-table-wrap">
        <table className="adm-list">
          <thead>
            <tr>
              <th>Convidado</th>
              <th>Tag</th>
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const tel = g.phone ? (g.phone.length <= 11 ? `55${g.phone}` : g.phone) : null;
              return (
                <tr key={g.id} className={g.guest_role === 'companion' ? 'is-companion' : ''}>
                  <td data-label="Convidado">
                    <strong>{g.full_name}</strong>
                    {g.guest_role === 'companion' && <span className="adm-small adm-muted"> acompanhante de {g.primary_name}</span>}
                  </td>
                  <td data-label="Tag">
                    <TagChip name={g.tag_name} color={g.tag_color} />
                  </td>
                  <td data-label="Telefone">
                    {tel ? (
                      <span className="adm-phone">
                        <a href={`tel:+${tel}`}>{formatPhone(g.phone)}</a>
                        <a className="adm-phone__wa" href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" title="Abrir conversa no WhatsApp">
                          WhatsApp
                        </a>
                      </span>
                    ) : (
                      <span className="adm-muted">—</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <QuickStatus guestId={g.id} status={g.attendance_status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
