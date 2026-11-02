import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Arrow, Emph, Eyebrow } from './Emph';

export function CelebrationDetails() {
  const { celebration, venue, images } = wedding;
  return (
    <section className="section section--sand" id="celebracao" aria-labelledby="celebracao-titulo">
      <div className="container">
        <header className="section-head">
          <Eyebrow>{celebration.eyebrow}</Eyebrow>
          <h2 className="display" id="celebracao-titulo">
            <Emph text={celebration.title} />
          </h2>
          <p className="section-head__text">{celebration.text}</p>
        </header>

        <div className="celebration">
          <ol className="schedule" aria-label="Programação">
            {celebration.schedule.map((s) => (
              <li className="schedule__item" key={s.time + s.title}>
                <time className="schedule__time">{s.time}</time>
                <span className="schedule__dot" aria-hidden="true" />
                <div>
                  <h3 className="schedule__title">{s.title}</h3>
                  <p className="schedule__lead">{s.lead}</p>
                  <p className="schedule__text">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <article className="venue">
            <div className="venue__photo">
              <ResponsiveBackground image={images.venue} sizes="(min-width: 900px) 40vw, 100vw" />
            </div>
            <div className="venue__body">
              <p className="venue__eyebrow">{celebration.venueEyebrow}</p>
              <h3 className="venue__name">{venue.name}</h3>
              <p className="venue__city">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15Z" />
                  <circle cx="8" cy="6.5" r="1.8" />
                </svg>
                {venue.city}
              </p>
              <a className="link-under" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
                {celebration.directionsLabel} <Arrow dir="out" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </div>
          </article>
        </div>

        <aside className="attire" aria-labelledby="aviso-titulo">
          {/* Ícone de policial (aviso sobre bebida e direção) */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 13.5c0-3 5-6.5 11-6.5s11 3.5 11 6.5c0 1.2-.6 1.9-1.6 2.2-2.6.8-6 1.2-9.4 1.2s-6.8-.4-9.4-1.2C9.6 15.4 9 14.7 9 13.5Z" />
            <path d="M12 16.2c-.3.9-.4 1.8-.4 2.8 0 4.8 3.8 8.6 8.4 8.6s8.4-3.8 8.4-8.6c0-1-.1-1.9-.4-2.8" />
            <path d="m20 9.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3Z" />
            <path d="M6.5 37c.6-5 4.3-8.2 9.5-9.2L20 31l4-3.2c5.2 1 8.9 4.2 9.5 9.2" />
            <path d="M20 31v6" />
          </svg>
          <div>
            <h3 id="aviso-titulo">{celebration.notice.title}</h3>
            <p>{celebration.notice.text}</p>
            <p className="attire__highlight">{celebration.notice.highlight}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
