import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

/** Converte **trecho** em negrito e [texto](https://...) em link. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="faq__link">
              {link[1]}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

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
                {(typeof item.a === 'string' ? [item.a] : item.a).map((p) => (
                  <p key={p}>
                    <Rich text={p} />
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
