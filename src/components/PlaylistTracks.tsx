import { wedding } from '@/config/wedding';
import { Arrow, Emph, Eyebrow } from './Emph';

export function PlaylistTracks() {
  const { playlist, links } = wedding;
  return (
    <section className="section section--warm" id="trilha" aria-labelledby="trilha-titulo">
      <div className="container split">
        <header>
          <Eyebrow>{playlist.eyebrow}</Eyebrow>
          <h2 className="display" id="trilha-titulo">
            <Emph text={playlist.title} />
          </h2>
          <p className="section-head__text split__text">{playlist.text}</p>
          <a className="link-under link-under--dark" href={links.playlist} target="_blank" rel="noopener noreferrer">
            {playlist.button} <Arrow dir="out" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </header>
        <div>
          <ol className="tracks" role="list">
            {playlist.tracks.map((t, i) => (
              <li key={t.title}>
                <a className="track" href={t.url || links.playlist} target="_blank" rel="noopener noreferrer">
                  <span className="track__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="track__icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M7 14.5V4l7-1.5" />
                      <circle cx="5" cy="14.5" r="2" />
                    </svg>
                  </span>
                  <span className="track__info">
                    <span className="track__title">{t.title}</span>
                    <span className="track__artist">{t.artist}</span>
                  </span>
                  <span className="track__go">
                    <Arrow dir="out" />
                  </span>
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ol>
          <p className="tracks__note">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <path d="M9 15.5S2.5 11.6 2.5 6.8A3.3 3.3 0 0 1 9 5.4a3.3 3.3 0 0 1 6.5 1.4C15.5 11.6 9 15.5 9 15.5Z" />
            </svg>
            {playlist.note}
          </p>
        </div>
      </div>
    </section>
  );
}
