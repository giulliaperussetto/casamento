import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/server/auth';
import { LoginForm } from './LoginForm';
import '../admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acesso administrativo', robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <main className="adm-login">
      <div className="adm-login__card">
        <p className="adm-eyebrow">Painel dos noivos</p>
        <h1>Acesso administrativo</h1>
        <LoginForm />
      </div>
    </main>
  );
}
