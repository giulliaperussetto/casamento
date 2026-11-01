import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

/** Accordion nativo (<details>): começa recolhido e funciona sem JavaScript. */
export function FAQAccordion() {
  const { faq } = wedding;
  return (
    <section className="section section--sand" id="duvidas" aria-labelledby="faq-titulo">
      <div className="container faq-wrap">
        <header>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className="display" id="faq-titulo">
            <Emph text={faq.title} />
          </h2>
          <p className="section-head__text">{faq.text}</p>
        </header>
        <div className="faq">
          {faq.items.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary className="faq__q">
                <span>{item.q}</span>
                <svg className="faq__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="m3 6 5 5 5-5" />
                </svg>
              </summary>
              <div className="faq__a">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
