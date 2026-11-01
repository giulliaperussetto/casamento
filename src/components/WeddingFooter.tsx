import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';

export function WeddingFooter() {
  const { couple, date, footer } = wedding;
  return (
    <footer className="footer">
      <div className="container center">
        <p className="footer__names">
          {couple.first} <span className="hero__amp">&amp;</span> {couple.second}
        </p>
        <p className="footer__date">{date.long}</p>
        <Ornament />
        <p className="footer__text">{footer.text}</p>
      </div>
    </footer>
  );
}
