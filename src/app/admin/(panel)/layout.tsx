import { requireAdmin } from '@/lib/server/auth';
import { logoutAction } from '../actions';
import '../admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel — Convidados', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Autorização no servidor: sem sessão válida, redireciona para o login.
  const admin = await requireAdmin();
  return (
    <div className="adm">
      <header className="adm-header">
        <div className="adm-wrap adm-header__inner">
          <strong>Painel das noivas</strong>
          <div className="adm-header__right">
            <span className="adm-muted">{admin.email}</span>
            <form action={logoutAction}>
              <button className="adm-btn adm-btn--ghost">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="adm-wrap">{children}</main>
    </div>
  );
}
