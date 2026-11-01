import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';

export function OurStory() {
  const { story, couple, images } = wedding;
  return (
    <section className="section section--white" id="nossa-historia" aria-labelledby="historia-titulo">
      <div className="container story">
        <figure className="story__photo">
          <ResponsiveBackground image={images.story} sizes="(min-width: 900px) 45vw, 100vw" />
        </figure>
        <div className="story__text">
          <p className="eyebrow">{story.eyebrow}</p>
          <h2 className="title" id="historia-titulo">{story.title}</h2>
          <span className="rule" aria-hidden="true" />
          <div className="prose">
            {story.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="signature" aria-hidden="true">
            {couple.first[0]} &amp; {couple.second[0]}
          </p>
        </div>
      </div>
    </section>
  );
}
