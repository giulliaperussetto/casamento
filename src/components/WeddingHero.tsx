import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';

export function WeddingHero() {
  const { couple, date, hero, images } = wedding;
  return (
    <header className="hero" id="inicio">
      <ResponsiveBackground image={images.hero} priority />
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__content">
        <h1 className="hero__names">
          <span>{couple.first}</span>
          <span className="hero__amp" aria-label="e">&amp;</span>
          <span>{couple.second}</span>
        </h1>
        <p className="hero__tagline">{hero.tagline}</p>
        <p className="hero__date">
          <time dateTime={date.iso.slice(0, 10)}>
            {date.day} <span aria-hidden="true">•</span> {date.month} <span aria-hidden="true">•</span> {date.year}
          </time>
        </p>
      </div>
      <a className="hero__hint" href="#mensagem">
        <span>{hero.scrollHint}</span>
        <span className="hero__hint-line" aria-hidden="true" />
      </a>
    </header>
  );
}
