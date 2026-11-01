import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';

/** Accordion nativo (<details>): começa recolhido e funciona sem JavaScript. */
export function FAQAccordion() {
  const { faq } = wedding;
  return (
    <section className="section section--white" id="duvidas" aria-labelledby="faq-titulo">
      <div className="container container--narrow">
        <div className="center">
          <Ornament />
          <h2 className="title" id="faq-titulo">{faq.title}</h2>
          <p className="lead">{faq.text}</p>
        </div>
        <div className="faq">
          {faq.items.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary className="faq__q">
                <span>{item.q}</span>
                <span className="faq__icon" aria-hidden="true" />
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
