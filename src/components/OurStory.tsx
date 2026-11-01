import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

export function OurStory() {
  const { story, couple } = wedding;
  return (
    <section className="section section--warm" id="nossa-historia" aria-labelledby="historia-titulo">
      <div className="container story">
        <div className="story__text">
          <Eyebrow>{story.eyebrow}</Eyebrow>
          <h2 className="display story__title" id="historia-titulo">
            <Emph text={story.title} />
          </h2>
          <p className="story__body">{story.text}</p>
          <div className="story__sign">
            <span>{story.signoff}</span>
            <strong>
              {couple.first} &amp; {couple.second}
            </strong>
          </div>
        </div>
        {/* Ilustração estática de duas alianças (sem animação) */}
        <svg className="story__rings" viewBox="0 0 320 240" aria-hidden="true">
          <defs>
            <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F3E2B8" />
              <stop offset=".45" stopColor="#C5A46D" />
              <stop offset="1" stopColor="#8A6A36" />
            </linearGradient>
            <radialGradient id="ring-shadow" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#4A1922" stopOpacity=".18" />
              <stop offset="1" stopColor="#4A1922" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="160" cy="214" rx="120" ry="14" fill="url(#ring-shadow)" />
          <circle cx="126" cy="118" r="70" fill="none" stroke="url(#ring-gold)" strokeWidth="11" />
          <circle cx="194" cy="118" r="70" fill="none" stroke="url(#ring-gold)" strokeWidth="11" />
          <path d="M160 58a70 70 0 0 1 0 120" fill="none" stroke="url(#ring-gold)" strokeWidth="11" />
        </svg>
      </div>
    </section>
  );
}
