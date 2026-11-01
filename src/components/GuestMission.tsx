import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';

export function GuestMission() {
  const { mission } = wedding;
  return (
    <section className="section section--warm" id="missao" aria-labelledby="missao-titulo">
      <div className="container container--narrow center">
        <p className="script">{mission.question}</p>
        <Ornament />
        <h2 className="title" id="missao-titulo">{mission.title}</h2>
        <div className="prose">
          {mission.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <a className="btn btn--outline" href="#rsvp">Confirmar presença</a>
      </div>
    </section>
  );
}
