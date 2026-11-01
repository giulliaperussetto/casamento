import { notFound } from 'next/navigation';
import { WeddingPage } from '@/components/WeddingPage';

/**
 * Link personalizado do convite: /CASA-XXXXX-XXXXX
 * Abre o site com o código já preenchido na confirmação de presença.
 * A validação real do código continua acontecendo no servidor.
 */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const value = decodeURIComponent(code).trim();
  if (!/^[A-Za-z0-9-]{10,24}$/.test(value)) notFound();
  return <WeddingPage initialCode={value.toUpperCase()} />;
}
