import { wedding } from '@/config/wedding';
import { GiftCarousel } from './GiftCarousel';
import { PixGift } from './PixGift';
import { Arrow, Emph, Eyebrow } from './Emph';

export function GiftsSection() {
  const { gifts, links } = wedding;
  return (
    <section className="section section--sand gifts-section" id="presentes" aria-labelledby="presentes-titulo">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <Eyebrow>{gifts.eyebrow}</Eyebrow>
            <h2 className="display" id="presentes-titulo">
              <Emph text={gifts.title} />
            </h2>
          </div>
          <p className="section-head__text">{gifts.text}</p>
        </header>
        {gifts.items.length > 0 && (
          <GiftCarousel items={gifts.items} href={links.giftList} buyLabel={gifts.buyLabel} />
        )}
        <div className="center">
          <a className="btn-solid btn-solid--center" href={links.giftList}>
            {gifts.button} <Arrow dir="out" />
          </a>
        </div>
        <PixGift />
      </div>
    </section>
  );
}
