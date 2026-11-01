import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Arrow, Emph } from './Emph';

/** Clima da festa + convite para a playlist (unificados). */
export function PartySection() {
  const { party, images, links } = wedding;
  return (
    <section className="party" id="festa" aria-labelledby="festa-titulo">
      <ResponsiveBackground image={images.party} decorative />
      <div className="party__shade" aria-hidden="true" />
      <div className="container party__content">
        <p className="hero__eyebrow">{party.eyebrow}</p>
        <h2 className="display display--light" id="festa-titulo">
          <Emph text={party.title} className="emph emph--gold" />
        </h2>
        <p className="party__text">{party.text}</p>
        <a className="btn-line btn-line--light" href={links.playlist} target="_blank" rel="noopener noreferrer">
          {party.button} <Arrow dir="out" />
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
      <svg className="party__curve" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120V40C240 10 480 0 720 0s480 10 720 40v80Z" />
      </svg>
    </section>
  );
}
