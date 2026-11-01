import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { wedding } from '@/config/wedding';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  // Endereço público: NEXT_PUBLIC_SITE_URL (domínio próprio) ou o domínio de produção da Vercel.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  title: wedding.seo.title,
  description: wedding.seo.description,
  openGraph: {
    title: wedding.seo.title,
    description: wedding.seo.description,
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: `${wedding.couple.first} & ${wedding.couple.second}` }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.jpg'] },
  robots: { index: false, follow: false },
  // Verificação do Google Search Console (Prefixo do URL → Tag HTML)
  verification: { google: 'E6ozlWn-BSyPbYCTLPbnzJCnOBbzPR-f4hhxzI8zYOI' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: wedding.theme.marsalaDeep,
};

const t = wedding.theme;
const themeVars = {
  '--white': t.white,
  '--warm': t.warmWhite,
  '--sand': t.sand,
  '--rose': t.rose,
  '--marsala': t.marsala,
  '--marsala-deep': t.marsalaDeep,
  '--gold': t.gold,
  '--gold-soft': t.goldSoft,
  '--black': t.black,
  '--text': t.text,
} as CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`} style={themeVars}>
      <body>{children}</body>
    </html>
  );
}
