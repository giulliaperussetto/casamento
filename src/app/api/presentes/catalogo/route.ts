import { GIFT_PRODUCTS, mpConfigured, mpPublicKey } from '@/lib/server/gifts';

export const dynamic = 'force-dynamic';

/** Catálogo e configuração de pagamento da página /presentes (script carregado antes da página). */
export function GET() {
  const data = { products: GIFT_PRODUCTS, card: mpConfigured() ? { publicKey: mpPublicKey() } : null };
  return new Response(`window.__PRESENTES__ = ${JSON.stringify(data)};`, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
