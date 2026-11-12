import { listTags } from '@/lib/server/admin';
import { createTagAction, deleteTagAction, updateTagAction } from '../../actions';
import { ConfirmSubmit } from '../ClientBits';
import { Flash } from '../shared';

export default async function TagsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const tags = await listTags();
  return (
    <>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="adm-title">
        <h1>Tags</h1>
        <span className="adm-muted">Organizam os convites no painel. Nunca aparecem no site.</span>
      </div>

      <section className="adm-panel adm-narrow">
        <h2>Nova tag</h2>
        <form action={createTagAction} className="adm-tagrow">
          <input type="hidden" name="returnTo" value="/admin/tags" />
          <input type="color" name="color" defaultValue="#8A4B5E" aria-label="Cor" />
          <input name="name" placeholder="Ex.: Amigos do trabalho" maxLength={40} required aria-label="Nome da tag" />
          <button className="adm-btn adm-btn--primary">Criar</button>
        </form>
      </section>

      <section className="adm-panel adm-narrow">
        <h2>Tags existentes</h2>
        {tags.length === 0 && <p className="adm-muted">Nenhuma tag ainda.</p>}
        <ul className="adm-taglist">
          {tags.map((t) => (
            <li key={t.id}>
              <form action={updateTagAction} className="adm-tagrow">
                <input type="hidden" name="returnTo" value="/admin/tags" />
                <input type="hidden" name="id" value={t.id} />
                <input type="color" name="color" defaultValue={t.color} aria-label={`Cor da tag ${t.name}`} />
                <input name="name" defaultValue={t.name} maxLength={40} required aria-label="Nome da tag" />
                <span className="adm-muted adm-small adm-tagrow__count">
                  {t.invitations} convite{t.invitations === 1 ? '' : 's'}
                </span>
                <button className="adm-btn adm-btn--small">Salvar</button>
                <ConfirmSubmit
                  message={`Excluir a tag "${t.name}"? Os convites dela ficarão sem tag.`}
                  className="adm-btn adm-btn--small adm-btn--danger"
                  formAction={deleteTagAction}
                >
                  Excluir
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
