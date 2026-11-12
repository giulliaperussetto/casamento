'use client';

/** Mostrado quando uma página do painel falha (ex.: arquivo do banco ainda não rodado). */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="adm-panel adm-narrow" style={{ marginTop: 24 }}>
      <h2>Não foi possível carregar o painel</h2>
      <p>
        O mais comum é faltar rodar algum arquivo do banco no Supabase. Abra a página de{' '}
        <a href="/diagnostico" target="_blank" rel="noopener noreferrer">
          diagnóstico
        </a>{' '}
        para ver exatamente o que falta e depois volte aqui.
      </p>
      <p className="adm-muted adm-small">
        Se o diagnóstico estiver todo com ✓, tente recarregar. Se continuar, avise com um print desta tela.
      </p>
      <button className="adm-btn adm-btn--primary" onClick={() => reset()}>
        Tentar de novo
      </button>
    </section>
  );
}
