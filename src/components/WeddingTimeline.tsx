import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';

export function WeddingTimeline() {
  const { timeline, images } = wedding;
  return (
    <section className="timeline-section" id="cronograma" aria-labelledby="cronograma-titulo">
      <ResponsiveBackground image={images.timeline} decorative />
      <div className="timeline-section__veil" aria-hidden="true" />
      <div className="container container--narrow timeline-section__content">
        <p className="eyebrow eyebrow--gold center">{timeline.eyebrow}</p>
        <h2 className="title title--light center" id="cronograma-titulo">{timeline.title}</h2>
        <ol className="timeline">
          {timeline.events.map((e) => (
            <li className="timeline__item" key={e.time + e.title}>
              <span className="timeline__dot" aria-hidden="true" />
              <time className="timeline__time">{e.time}</time>
              <h3 className="timeline__title">{e.title}</h3>
              <p className="timeline__text">{e.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
