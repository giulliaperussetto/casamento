import { wedding } from '@/config/wedding';
import { Eyebrow } from './Emph';

export function GuestMission() {
  const { mission } = wedding;
  return (
    <section className="section section--warm section--compact" id="missao" aria-labelledby="missao-titulo">
      <div className="container container--narrow center">
        <Eyebrow>{mission.question}</Eyebrow>
        <h2 className="display display--md" id="missao-titulo">{mission.title}</h2>
        <div className="prose">
          {mission.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
