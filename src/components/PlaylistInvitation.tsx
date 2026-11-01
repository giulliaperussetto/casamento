import { wedding } from '@/config/wedding';

export function PlaylistInvitation() {
  const { playlist, links } = wedding;
  return (
    <section className="section section--black" id="playlist" aria-labelledby="playlist-titulo">
      <div className="container container--narrow center">
        <svg className="playlist__icon" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1" />
          <path d="M17 13v12.2a3 3 0 1 1-2-2.8V15l11-2.5v9.7a3 3 0 1 1-2-2.8v-5.6L17 15.4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <h2 className="title title--light" id="playlist-titulo">{playlist.title}</h2>
        <p className="lead lead--light">{playlist.text}</p>
        <a className="btn btn--gold" href={links.playlist} target="_blank" rel="noopener noreferrer">
          {playlist.buttonLabel}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </section>
  );
}
