import { wedding } from '@/config/wedding';
import { GiftCarousel } from './GiftCarousel';
import { Arrow, Emph, Eyebrow } from './Emph';

export function GiftsSection() {
  const { gifts, links } = wedding;
  return (
    <section className="section section--marsala gifts-section" id="presentes" aria-labelledby="presentes-titulo">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <Eyebrow light>{gifts.eyebrow}</Eyebrow>
            <h2 className="display display--light" id="presentes-titulo">
              <Emph text={gifts.title} className="emph emph--gold" />
            </h2>
          </div>
          <p className="section-head__text">{gifts.text}</p>
        </header>
        <GiftCarousel items={gifts.items} href={links.giftList} />
        <div className="center">
          <a className="btn-solid btn-solid--gold" href={links.giftList} target="_blank" rel="noopener noreferrer">
            {gifts.button} <Arrow dir="out" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
