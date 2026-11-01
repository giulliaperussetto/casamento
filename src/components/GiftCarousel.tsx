'use client';

import Image from 'next/image';
import { useRef } from 'react';

type Item = { name: string; price?: string; image?: string };

/** Carrossel simples (rolagem horizontal apenas dentro do componente, com setas). */
export function GiftCarousel({ items, href }: { items: readonly Item[]; href: string }) {
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
        {items.map((item) => (
          <li className="gift" key={item.name}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="gift__link">
              <span className="gift__img">
                {item.image ? (
                  <Image src={item.image} alt="" fill sizes="(min-width: 900px) 280px, 70vw" />
                ) : (
                  <span className="gift__ph" aria-hidden="true">✦</span>
                )}
              </span>
              <span className="gift__name">{item.name}</span>
              {item.price && <span className="gift__price">{item.price}</span>}
              <span className="sr-only"> (abre a lista de presentes em nova aba)</span>
            </a>
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
