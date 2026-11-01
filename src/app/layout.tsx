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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: wedding.seo.title,
  description: wedding.seo.description,
  openGraph: { title: wedding.seo.title, description: wedding.seo.description, images: [wedding.images.hero.desktop] },
  robots: { index: false, follow: false },
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
