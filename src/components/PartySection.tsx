import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Ornament } from './Ornament';

export function PartySection() {
  const { party, images } = wedding;
  return (
    <section className="party" id="festa" aria-labelledby="festa-titulo">
      <ResponsiveBackground image={images.party} decorative />
      <div className="party__shade" aria-hidden="true" />
      <div className="container container--narrow center party__content">
        <Ornament className="ornament--gold" />
        <h2 className="title title--light title--xl" id="festa-titulo">{party.title}</h2>
        <p className="lead lead--light">{party.text}</p>
      </div>
    </section>
  );
}
