'use client';

import Image from 'next/image';
import { useRef } from 'react';

type Item = { name: string; price?: string; image?: string; url?: string };
/** "R$ 2.599,00" → 2599 */
const toNumber = (p?: string) => Number((p ?? '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

/** Carrossel simples (rolagem horizontal apenas dentro do componente, com setas). */
export function GiftCarousel({
  items,
  href,
  buyLabel,
}: {
  items: readonly Item[];
  href: string;
  buyLabel: string;
}) {
  // Ordem crescente de preço.
  const sorted = [...items].sort((a, b) => toNumber(a.price) - toNumber(b.price));
  const track = useRef<HTMLUListElement>(null);

  function move(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'auto' });
  }

  return (
    <div className="gifts">
      <ul className="gifts__track" ref={track} role="list" aria-label="Sugestões de presentes" tabIndex={0}>
        {sorted.map((item) => (
          <li className="gift" key={item.name}>
            <article className="gift__card">
              <div className="gift__img">
                {item.image ? (
                  <Image src={item.image} alt="" fill sizes="(min-width: 900px) 280px, 70vw" />
                ) : (
                  <span className="gift__ph" aria-hidden="true">✦</span>
                )}
                <div className="gift__overlay">
                  {item.price && <span className="gift__price">{item.price}</span>}
                  <a href={item.url || href} target="_blank" rel="noopener noreferrer" className="gift__buy">
                    {buyLabel}
                    <span className="sr-only">: {item.name} (abre a lista de presentes em nova aba)</span>
                  </a>
                </div>
              </div>
              <h3 className="gift__name">{item.name}</h3>
            </article>
          </li>
        ))}
      </ul>
      <div className="gifts__nav">
        <button type="button" className="gifts__arrow" onClick={() => move(-1)} aria-label="Presentes anteriores">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M14 8H2M7 3 2 8l5 5" />
          </svg>
        </button>
        <button type="button" className="gifts__arrow" onClick={() => move(1)} aria-label="Próximos presentes">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M2 8h12M9 3l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
