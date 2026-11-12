import { listGiftOrders } from '@/lib/server/admin';
import { deleteGiftOrderAction, setGiftReceivedAction } from '../../actions';
import { ConfirmSubmit } from '../ClientBits';
import { Flash, fmtDate } from '../shared';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Presentes informados na página /presentes ("Já fiz o Pix"). */
export default async function PresentesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const orders = await listGiftOrders();
  const sum = (list: typeof orders) => list.reduce((s, o) => s + Number(o.total), 0);
  const received = orders.filter((o) => o.received);

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="adm-title">
        <h1>Presentes</h1>
        <span className="adm-muted">Avisos de quem fez Pix pela lista. Confira no extrato e marque como recebido.</span>
      </div>

      <section className="adm-cards" aria-label="Resumo dos presentes">
        <div className="adm-card">
          <span className="adm-card__value">{orders.length}</span>
          <span className="adm-card__label">Presentes informados</span>
        </div>
        <div className="adm-card">
          <span className="adm-card__value">{brl(sum(orders))}</span>
          <span className="adm-card__label">Total informado</span>
        </div>
        <div className="adm-card adm-card--green">
          <span className="adm-card__value">{brl(sum(received))}</span>
          <span className="adm-card__label">Já conferido no extrato</span>
          <span className="adm-card__hint">{received.length} presente{received.length === 1 ? '' : 's'}</span>
        </div>
      </section>

      {orders.length === 0 && <p className="adm-empty">Nenhum presente informado ainda.</p>}

      <ul className="adm-gifts">
        {orders.map((o) => (
          <li key={o.id} className={`adm-gift${o.received ? ' is-received' : ''}`}>
            <div className="adm-gift__head">
              <div>
                <strong>{o.giver_name}</strong>
                <span className="adm-muted adm-small"> · {fmtDate(o.created_at)}</span>
              </div>
              <span className="adm-gift__total">{brl(Number(o.total))}</span>
            </div>
            <ul className="adm-gift__items">
              {o.items.map((i, k) => (
                <li key={k}>
                  {i.qty > 1 ? `${i.qty}× ` : ''}
                  {i.name} <span className="adm-muted">· {brl(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            {o.message && <blockquote className="adm-gift__msg">“{o.message}”</blockquote>}
            <div className="adm-gift__actions">
              <span className={`adm-pill${o.received ? ' adm-pill--ok' : ''}`}>{o.received ? 'Pix conferido' : 'Aguardando conferência'}</span>
              <form action={setGiftReceivedAction}>
                <input type="hidden" name="returnTo" value="/admin/presentes" />
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="received" value={String(!o.received)} />
                <button className="adm-btn adm-btn--small">{o.received ? 'Desmarcar' : 'Marcar como recebido'}</button>
              </form>
              <form action={deleteGiftOrderAction}>
                <input type="hidden" name="returnTo" value="/admin/presentes" />
                <input type="hidden" name="id" value={o.id} />
                <ConfirmSubmit message="Excluir este registro?" className="adm-linkbtn adm-linkbtn--danger">
                  Excluir
                </ConfirmSubmit>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
