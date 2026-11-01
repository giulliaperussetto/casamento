import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Emph, Eyebrow } from './Emph';

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
        <figure className="party-photo">
          <ResponsiveBackground image={images.dressCode} sizes="(min-width: 1160px) 1100px, 100vw" />
        </figure>
      </div>
    </section>
  );
}
