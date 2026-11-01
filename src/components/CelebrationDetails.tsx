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
                  <p className="schedule__text">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <article className="venue">
            <ResponsiveBackground image={images.venue} sizes="(min-width: 900px) 40vw, 100vw" />
            <div className="venue__shade" aria-hidden="true" />
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

        <div className="attire">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="M11 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7ZM20 15c.4 2.2 1.2 3 3.4 3.4-2.2.4-3 1.2-3.4 3.4-.4-2.2-1.2-3-3.4-3.4 2.2-.4 3-1.2 3.4-3.4Z" />
          </svg>
          <div>
            <h3>{celebration.attire.title}</h3>
            <p>{celebration.attire.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
