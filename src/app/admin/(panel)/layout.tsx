import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/server/auth';
import { wedding } from '@/config/wedding';
import { logoutAction } from '../actions';
import { NavLinks } from './ClientBits';
import '../admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel dos convidados', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Autorização no servidor: sem sessão válida, redireciona para o login.
  const admin = await requireAdmin();
  return (
    <div className="adm">
      <header className="adm-header">
        <div className="adm-wrap adm-header__inner">
          <Link href="/admin" className="adm-brand">
            <Image src={wedding.couple.monogramLight} alt="" width={749} height={870} sizes="40px" priority />
            <span>Painel dos convidados</span>
          </Link>
          <NavLinks />
          <div className="adm-header__right">
            <Link href="/admin/novo" className="adm-btn adm-btn--gold">
              + Novo convite
            </Link>
            <span className="adm-header__email">{admin.email}</span>
            <form action={logoutAction}>
              <button className="adm-btn adm-btn--ghost">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="adm-wrap adm-main">{children}</main>
    </div>
  );
}
