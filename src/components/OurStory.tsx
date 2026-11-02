import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

export function OurStory() {
  const { story, couple } = wedding;
  return (
    <section className="section section--warm" id="nossa-historia" aria-labelledby="historia-titulo">
      <div className="container story">
        <Eyebrow>{story.eyebrow}</Eyebrow>
        <h2 className="display story__title" id="historia-titulo">
          <Emph text={story.title} />
        </h2>
        <div className="story__body">
          {story.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="story__sign">
          <span>{story.signoff}</span>
          <strong>
            {couple.first} &amp; {couple.second}
          </strong>
        </div>
      </div>
    </section>
  );
}
