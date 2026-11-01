import { wedding } from '@/config/wedding';

export function WeddingFooter() {
  const { couple, date, footer } = wedding;
  return (
    <footer className="footer">
      <div className="container center">
        <p className="footer__names">
          {couple.first} <span className="footer__amp">&amp;</span> {couple.second}
        </p>
        <p className="footer__date">{date.long}</p>
        <span className="footer__rule" aria-hidden="true" />
        <p className="footer__text">{footer.text}</p>
      </div>
    </footer>
  );
}
