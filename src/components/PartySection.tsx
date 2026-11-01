import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Arrow, Emph } from './Emph';

/** Clima da festa; o botão leva à lista de músicas logo abaixo. */
export function PartySection() {
  const { party, images } = wedding;
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
        <a className="btn-line btn-line--light" href="#trilha">
          {party.button} <Arrow dir="down" />
        </a>
      </div>
    </section>
  );
}
