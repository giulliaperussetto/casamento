import { runDiagnostics } from '@/lib/server/diagnostics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Diagnóstico', robots: { index: false, follow: false } };

/** Página de verificação da configuração (não mostra senhas nem dados de convidados). */
export default async function Diagnostico() {
  const checks = await runDiagnostics();
  const allOk = checks.every((c) => c.ok);
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui, sans-serif', color: '#292323' }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Diagnóstico do site</h1>
      <p style={{ color: '#6b5f60', marginBottom: 24 }}>
        {allOk ? 'Tudo certo! O site está conectado ao banco e pronto para receber confirmações.' : 'Corrija os itens marcados com ✗ e recarregue esta página.'}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
        {checks.map((c) => (
          <li key={c.label} style={{ padding: '12px 14px', borderRadius: 12, background: c.ok ? '#eef6ee' : '#fbeeee' }}>
            <strong style={{ color: c.ok ? '#1d4d1d' : '#7d1a1a' }}>{c.ok ? '✓' : '✗'} {c.label}</strong>
            {c.detail && <div style={{ marginTop: 4, fontSize: 14 }}>{c.detail}</div>}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 24, fontSize: 13, color: '#8b7d7f' }}>
        Depois de alterar variáveis na Vercel, faça um Redeploy para que elas passem a valer.
      </p>
    </main>
  );
}
