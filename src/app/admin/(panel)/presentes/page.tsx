import { listGiftOrders, type GiftOrder } from '@/lib/server/admin';
import { deleteGiftOrderAction, setGiftReceivedAction } from '../../actions';
import { ConfirmSubmit } from '../ClientBits';
import { Flash, fmtDate } from '../shared';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Status de cada presente, em português. */
function statusInfo(o: GiftOrder): { label: string; tone: 'ok' | 'wait' | 'bad' } {
  if (o.method === 'pix') return o.received ? { label: 'Pix conferido', tone: 'ok' } : { label: 'Pix: conferir no extrato', tone: 'wait' };
  switch (o.status) {
    case 'approved':
      return { label: 'Cartão aprovado · pago', tone: 'ok' };
    case 'in_process':
    case 'pending':
    case 'processing':
      return { label: 'Cartão em análise', tone: 'wait' };
    case 'refunded':
    case 'charged_back':
      return { label: 'Cartão estornado', tone: 'bad' };
    default:
      return { label: 'Cartão recusado', tone: 'bad' };
  }
}
const counts = (o: GiftOrder) => o.method === 'pix' || ['approved', 'in_process', 'pending'].includes(o.status);

/** Presentes recebidos pela página /presentes (Pix informado e cartão pelo Mercado Pago). */
export default async function PresentesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; ver?: string }> }) {
  const sp = await searchParams;
  const all = await listGiftOrders();
  const showFailed = sp.ver === 'todos';
  const orders = showFailed ? all : all.filter(counts);
  const failed = all.length - all.filter(counts).length;
  const sum = (list: GiftOrder[]) => list.reduce((s, o) => s + Number(o.total), 0);
  const valid = all.filter(counts);
  const paid = valid.filter((o) => o.received);
  const card = valid.filter((o) => o.method === 'card' && o.status === 'approved');

  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="adm-title">
        <h1>Presentes</h1>
        <span className="adm-muted">Pix cai direto na sua conta (confira no extrato). Cartão aprovado já aparece como pago.</span>
      </div>

      <section className="adm-cards" aria-label="Resumo dos presentes">
        <div className="adm-card">
          <span className="adm-card__value">{valid.length}</span>
          <span className="adm-card__label">Presentes</span>
        </div>
        <div className="adm-card">
          <span className="adm-card__value">{brl(sum(valid))}</span>
          <span className="adm-card__label">Total dos presentes</span>
        </div>
        <div className="adm-card adm-card--green">
          <span className="adm-card__value">{brl(sum(paid))}</span>
          <span className="adm-card__label">Já pago</span>
          <span className="adm-card__hint">
            {card.length} no cartão · {paid.length - card.length} Pix conferido{paid.length - card.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>

      {failed > 0 && (
        <p className="adm-small adm-muted" style={{ marginBottom: 12 }}>
          {showFailed ? (
            <a href="/admin/presentes">Esconder tentativas de cartão recusadas</a>
          ) : (
            <a href="/admin/presentes?ver=todos">
              Ver {failed} tentativa{failed === 1 ? '' : 's'} de cartão recusada{failed === 1 ? '' : 's'}
            </a>
          )}
        </p>
      )}

      {orders.length === 0 && <p className="adm-empty">Nenhum presente ainda.</p>}

      <ul className="adm-gifts">
        {orders.map((o) => {
          const st = statusInfo(o);
          return (
            <li key={o.id} className={`adm-gift${o.received ? ' is-received' : ''}${st.tone === 'bad' ? ' is-failed' : ''}`}>
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
                <span className={`adm-pill adm-pill--${st.tone}`}>{st.label}</span>
                {o.method === 'card' && o.installments && o.installments > 1 && (
                  <span className="adm-small adm-muted">
                    {o.installments}x (juros pagos por quem presenteou{o.paid_amount ? `; total cobrado ${brl(Number(o.paid_amount))}` : ''})
                  </span>
                )}
                {o.mp_payment_id && <span className="adm-small adm-muted">Mercado Pago nº {o.mp_payment_id}</span>}
                {o.method === 'pix' && (
                  <form action={setGiftReceivedAction}>
                    <input type="hidden" name="returnTo" value="/admin/presentes" />
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="received" value={String(!o.received)} />
                    <button className="adm-btn adm-btn--small">{o.received ? 'Desmarcar' : 'Marcar Pix como recebido'}</button>
                  </form>
                )}
                <form action={deleteGiftOrderAction}>
                  <input type="hidden" name="returnTo" value="/admin/presentes" />
                  <input type="hidden" name="id" value={o.id} />
                  <ConfirmSubmit message="Excluir este registro? (Não estorna nada no Mercado Pago.)" className="adm-linkbtn adm-linkbtn--danger">
                    Excluir
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
