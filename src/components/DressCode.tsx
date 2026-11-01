import Image from 'next/image';
import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';

function Placeholder({ label, kind }: { label: string; kind: 'dress' | 'suit' }) {
  return (
    <div className="look__placeholder" role="img" aria-label={`${label} (em breve)`}>
      <svg viewBox="0 0 60 120" width="46" height="92" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        {kind === 'dress' ? (
          <path d="M24 6c0 4 2 7 6 7s6-3 6-7M22 8l-2 22 6 8-14 76h36L34 38l6-8-2-22" strokeLinejoin="round" />
        ) : (
          <path d="M22 6l8 10 8-10M22 6l-10 6-2 50h8l2 54h9l3-50 3 50h9l2-54h8l-2-50-10-6M30 16v40" strokeLinejoin="round" />
        )}
      </svg>
      <span>Ilustração em breve</span>
    </div>
  );
}

export function DressCode() {
  const { dressCode } = wedding;
  return (
    <section className="section section--warm" id="dress-code" aria-labelledby="dresscode-titulo">
      <div className="container">
        <div className="center container--narrow">
          <Ornament />
          <h2 className="title" id="dresscode-titulo">{dressCode.title}</h2>
          <p className="subtitle">{dressCode.subtitle}</p>
          <p className="lead">{dressCode.text}</p>
        </div>

        {dressCode.groups.map((group, gi) => (
          <div className="looks" key={group.title}>
            <div className="looks__head">
              <h3 className="looks__title">{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <ul className="looks__grid" role="list">
              {group.images.map((img) => (
                <li className="look" key={img.alt}>
                  {img.src ? (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 900px) 25vw, 45vw"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <Placeholder label={img.alt} kind={gi === 0 ? 'dress' : 'suit'} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="palette">
          <h3 className="looks__title center">{dressCode.paletteTitle}</h3>
          <ul className="palette__list" role="list">
            {dressCode.palette.map((c) => (
              <li key={c.hex}>
                <span className="palette__swatch" style={{ background: c.hex }} aria-hidden="true" />
                <span className="palette__name">{c.name}</span>
              </li>
            ))}
          </ul>
          <p className="note center">{dressCode.note}</p>
        </div>
      </div>
    </section>
  );
}
