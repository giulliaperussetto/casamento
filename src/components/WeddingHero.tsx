import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Arrow } from './Emph';

export function WeddingHero() {
  const { couple, date, hero, images, nav, venue } = wedding;
  return (
    <header className="hero" id="inicio">
      <ResponsiveBackground image={images.hero} priority />
      <div className="hero__shade" aria-hidden="true" />

      <nav className="topnav" aria-label="Navegação principal">
        <a href="#inicio" className="topnav__mark" aria-label={`${couple.first} e ${couple.second}`}>
          {couple.monogram[0]}
          <span>&amp;</span>
          {couple.monogram[1]}.
        </a>
        <ul className="topnav__links" role="list">
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href}>{n.label}</a>
            </li>
          ))}
        </ul>
        <a href="#rsvp" className="btn-line btn-line--light topnav__cta">
          Confirmar presença <Arrow dir="out" />
        </a>
      </nav>

      <div className="hero__content">
        <p className="hero__eyebrow">{hero.eyebrow}</p>
        <h1 className="hero__names">
          <span className="hero__first">
            {couple.first}
            <span className="hero__amp" aria-label="e">&amp;</span>
          </span>
          <span>{couple.second}</span>
        </h1>
        <p className="hero__date">
          <time dateTime={date.iso.slice(0, 10)}>{date.label}</time>
        </p>
        <a className="btn-line btn-line--light" href="#nossa-historia">
          {hero.button} <Arrow dir="down" />
        </a>
      </div>

      <p className="hero__side" aria-hidden="true">
        <span>{hero.side[0]}</span>
        <span>{hero.side[1]}</span>
      </p>

      <div className="hero__bottom">
        <span>{venue.city.replace(', ', ' · ')}</span>
        <span className="hero__bottom-line" aria-hidden="true" />
        <span>{hero.scrollHint}</span>
      </div>
    </header>
  );
}
