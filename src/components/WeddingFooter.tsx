import Image from 'next/image';
import { wedding } from '@/config/wedding';

export function WeddingFooter() {
  const { couple, date, footer } = wedding;
  return (
    <footer className="footer">
      <div className="container center">
        <Image className="footer__mono" src={couple.monogramLight} alt="" width={749} height={870} sizes="80px" />
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
