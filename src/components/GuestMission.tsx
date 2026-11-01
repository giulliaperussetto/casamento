import { wedding } from '@/config/wedding';
import { Emph, Eyebrow } from './Emph';

export function GuestMission() {
  const { mission } = wedding;
  return (
    <section className="section section--warm section--compact" id="missao" aria-labelledby="missao-titulo">
      <div className="container container--narrow center mission">
        <Eyebrow>{mission.question}</Eyebrow>
        <h2 className="display display--md mission__title" id="missao-titulo">
          <Emph text={mission.title} />
        </h2>
        <div className="prose">
          {mission.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <aside className="mission__request" aria-labelledby="pedido-titulo">
          {/* Ícone: celular guardado */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <rect x="10" y="4" width="14" height="26" rx="3" />
            <path d="M15 26h4" />
            <path d="m5 5 24 24" />
          </svg>
          <h3 id="pedido-titulo">{mission.request.title}</h3>
          {mission.request.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </aside>

        <p className="mission__closing">{mission.closing}</p>
      </div>
    </section>
  );
}
