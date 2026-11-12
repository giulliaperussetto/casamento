import Link from 'next/link';
import { listTags } from '@/lib/server/admin';
import { createInvitationAction } from '../../actions';
import { CompanionFields } from '../ClientBits';
import { Flash } from '../shared';

export default async function NovoConvitePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const tags = await listTags();
  return (
    <>
      <Flash error={sp.error} />
      <div className="adm-title">
        <h1>Novo convite</h1>
      </div>
      <section className="adm-panel adm-narrow">
        <form action={createInvitationAction} className="adm-form">
          <input type="hidden" name="returnTo" value="/admin/novo" />
          <label>
            Nome do convidado principal
            <input name="primaryName" required minLength={2} maxLength={120} autoFocus />
          </label>
          <label>
            Tag
            <select name="tagId" defaultValue="">
              <option value="">Sem tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="adm-muted adm-small">
              Só aparece no painel. <Link href="/admin/tags">Criar ou editar tags</Link>
            </span>
          </label>
          <CompanionFields />
          <label>
            Observação interna (opcional)
            <input name="label" maxLength={120} placeholder="Ex.: tios da Giullia" />
          </label>
          <button className="adm-btn adm-btn--primary">Criar convite e gerar código</button>
        </form>
      </section>
    </>
  );
}
