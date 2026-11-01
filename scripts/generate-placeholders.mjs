/**
 * Gera imagens PROVISÓRIAS (WebP) em public/images.
 * Substitua pelos arquivos reais mantendo os mesmos nomes — ou altere os
 * caminhos em src/config/wedding.ts.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/images';
mkdirSync(OUT, { recursive: true });

// Gerador pseudoaleatório determinístico
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const label = (w, h, text, color = 'rgba(255,255,255,0.55)') => `
  <text x="${w / 2}" y="${Math.round(Math.min(w, h) * 0.05)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${Math.round(Math.min(w, h) * 0.018)}" letter-spacing="6" fill="${color}">${text}</text>`;

function bokeh(w, h, n, palette, rMin, rMax, opacity = 0.5) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const c = palette[Math.floor(rnd() * palette.length)];
    s += `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h).toFixed(0)}" r="${(rMin + rnd() * (rMax - rMin)).toFixed(0)}" fill="${c}" opacity="${(opacity * (0.4 + rnd() * 0.6)).toFixed(2)}"/>`;
  }
  return s;
}

const scenes = {
  hero: (w, h) => `
    <defs>
      <radialGradient id="sun" cx="0.62" cy="0.38" r="0.75">
        <stop offset="0" stop-color="#F3D9A6"/><stop offset="0.35" stop-color="#C98E6A"/>
        <stop offset="0.7" stop-color="#7A3A3F"/><stop offset="1" stop-color="#2A0F14"/>
      </radialGradient>
      <filter id="b"><feGaussianBlur stdDeviation="${w * 0.012}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#sun)"/>
    <g filter="url(#b)">${bokeh(w, h, 40, ['#FCE9C4', '#E9B98A', '#FFFFFF'], w * 0.01, w * 0.05, 0.35)}</g>
    <path d="M0 ${h * 0.82} Q ${w * 0.3} ${h * 0.74} ${w * 0.55} ${h * 0.8} T ${w} ${h * 0.76} V ${h} H 0 Z" fill="#1E0A0E" opacity="0.65"/>
    ${label(w, h, 'FOTO PROVISÓRIA · CASAL')}`,

  rings: (w, h) => {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.14;
    return `
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.45" r="0.8">
        <stop offset="0" stop-color="#FBF4EA"/><stop offset="0.6" stop-color="#E9D8C0"/><stop offset="1" stop-color="#B99B78"/>
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F6E3B4"/><stop offset="0.45" stop-color="#C5A46D"/><stop offset="1" stop-color="#7C5A2A"/>
      </linearGradient>
      <filter id="s"><feGaussianBlur stdDeviation="${r * 0.12}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <ellipse cx="${cx}" cy="${cy + r * 1.25}" rx="${r * 1.9}" ry="${r * 0.25}" fill="#6b4a2a" opacity="0.25" filter="url(#s)"/>
    <circle cx="${cx - r * 0.55}" cy="${cy}" r="${r}" fill="none" stroke="url(#gold)" stroke-width="${r * 0.16}"/>
    <circle cx="${cx + r * 0.55}" cy="${cy}" r="${r}" fill="none" stroke="url(#gold)" stroke-width="${r * 0.16}"/>
    ${label(w, h, 'FOTO PROVISÓRIA · ALIANÇAS', 'rgba(74,25,34,0.45)')}`;
  },

  story: (w, h) => `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#EAD3C6"/><stop offset="0.55" stop-color="#C79A92"/><stop offset="1" stop-color="#6E3A40"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="${w * 0.02}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#b)">${bokeh(w, h, 26, ['#FFF4E6', '#F1CBB5', '#D8BF91'], w * 0.03, w * 0.1, 0.4)}</g>
    ${label(w, h, 'FOTO PROVISÓRIA · HISTÓRIA')}`,

  celebration: (w, h) => `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F2E7D3"/><stop offset="0.5" stop-color="#A9A98A"/><stop offset="1" stop-color="#3F4A35"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.015}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#b)">${bokeh(w, h * 0.6, 60, ['#FFFDF6', '#F4E2BF', '#D8BF91'], Math.min(w, h) * 0.006, Math.min(w, h) * 0.02, 0.8)}</g>
    <path d="M ${w * 0.3} ${h} V ${h * 0.48} A ${w * 0.2} ${w * 0.2} 0 0 1 ${w * 0.7} ${h * 0.48} V ${h}" fill="none" stroke="#FAF8F5" stroke-opacity="0.55" stroke-width="${Math.min(w, h) * 0.012}"/>
    ${label(w, h, 'FOTO PROVISÓRIA · LOCAL')}`,

  fabric: (w, h) => {
    const stops = [];
    let x = 0;
    while (x < 1) {
      const light = 0.15 + rnd() * 0.45;
      stops.push(`<stop offset="${x.toFixed(3)}" stop-color="rgb(${Math.round(70 + light * 120)},${Math.round(20 + light * 40)},${Math.round(30 + light * 45)})"/>`);
      x += 0.04 + rnd() * 0.07;
    }
    return `
    <defs>
      <linearGradient id="folds" x1="0" y1="0" x2="1" y2="0.18">${stops.join('')}</linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/>
      </linearGradient>
      <filter id="warp">
        <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.0009" numOctaves="2" seed="4"/>
        <feDisplacementMap in="SourceGraphic" scale="${w * 0.08}"/>
      </filter>
    </defs>
    <rect x="-10%" y="-10%" width="120%" height="120%" fill="url(#folds)" filter="url(#warp)"/>
    <rect width="100%" height="100%" fill="url(#shade)"/>
    ${label(w, h, 'IMAGEM PROVISÓRIA · TECIDO')}`;
  },

  party: (w, h) => `
    <defs>
      <radialGradient id="bg" cx="0.5" cy="0.1" r="1">
        <stop offset="0" stop-color="#3A1A22"/><stop offset="0.5" stop-color="#140A0D"/><stop offset="1" stop-color="#050505"/>
      </radialGradient>
      <filter id="b"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.012}"/></filter>
      <filter id="b2"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.004}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#b)">${bokeh(w, h * 0.7, 45, ['#C5A46D', '#E7C98F', '#8C2F45', '#B0476A', '#F6E6C8'], Math.min(w, h) * 0.015, Math.min(w, h) * 0.06, 0.55)}</g>
    <g filter="url(#b2)">${bokeh(w, h * 0.5, 120, ['#FFF2D6', '#E7C98F'], 2, Math.min(w, h) * 0.006, 0.9)}</g>
    <rect y="${h * 0.78}" width="100%" height="${h * 0.22}" fill="#000" opacity="0.5"/>
    ${label(w, h, 'FOTO PROVISÓRIA · FESTA')}`,
};

const jobs = [
  ['hero-desktop', 'hero', 2400, 1500], ['hero-mobile', 'hero', 1080, 1920],
  ['rings-desktop', 'rings', 2400, 1400], ['rings-mobile', 'rings', 1080, 1350],
  ['story', 'story', 1200, 1500],
  ['celebration-desktop', 'celebration', 1600, 1800], ['celebration-mobile', 'celebration', 1080, 1300],
  ['fabric-desktop', 'fabric', 2400, 1600], ['fabric-mobile', 'fabric', 1080, 2200],
  ['party-desktop', 'party', 2400, 1500], ['party-mobile', 'party', 1080, 1920],
];

for (const [name, scene, w, h] of jobs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${scenes[scene](w, h)}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(`${OUT}/${name}.webp`);
  console.log('✓', name);
}
