import Image from 'next/image';
import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

const ICONS = {
  dress: <path d="M10 3h6l-1 5 4 14H7l4-14-1-5Zm0 0 3 3 3-3" />,
  palette: (
    <>
      <path d="M13 3a10 10 0 1 0 0 20c1.5 0 2-1 2-2s-1-1.6-1-2.6S15 17 16 17h2.5A4.5 4.5 0 0 0 23 12.5C23 7.3 18.5 3 13 3Z" />
      <circle cx="8.5" cy="11" r="1.3" />
      <circle cx="12" cy="7.5" r="1.3" />
      <circle cx="17" cy="8.5" r="1.3" />
    </>
  ),
  ban: (
    <>
      <circle cx="13" cy="13" r="9.5" />
      <path d="m6.3 6.3 13.4 13.4" />
    </>
  ),
} as const;

export function DressCode() {
  const { dressCode, images } = wedding;
  return (
    <section className="section section--white section--compact" id="dress-code" aria-labelledby="dresscode-titulo">
      <div className="container">
        <header className="section-head">
          <Eyebrow>{dressCode.eyebrow}</Eyebrow>
          <h2 className="display display--md" id="dresscode-titulo">
            <Emph text={dressCode.title} />
          </h2>
          <p className="section-head__text">{dressCode.text}</p>
        </header>

        <ul className="dress-rules" role="list">
          {dressCode.rules.map((r) => (
            <li key={r.title} className={`dress-rule dress-rule--${r.icon}`}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                {ICONS[r.icon as keyof typeof ICONS]}
              </svg>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              {'swatches' in r && (
                <span className="dress-rule__swatches" aria-hidden="true">
                  {r.swatches.map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>

        <figure className="dress-figure">
          <figcaption>
            <h3 className="dress-figure__title">
              <Emph text={dressCode.figureTitle} />
            </h3>
            <p>{dressCode.figureText}</p>
          </figcaption>
          <Image
            src={images.dressCode.desktop}
            alt={images.dressCode.alt}
            width={2548}
            height={1888}
            quality={90}
            sizes="(min-width: 1180px) 1100px, 100vw"
          />
        </figure>
      </div>
    </section>
  );
}
