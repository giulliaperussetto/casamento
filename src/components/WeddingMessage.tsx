import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';

export function WeddingMessage() {
  const { message } = wedding;
  return (
    <section className="section section--warm" id="mensagem" aria-labelledby="mensagem-titulo">
      <div className="container container--narrow center">
        <Ornament />
        <h2 className="title" id="mensagem-titulo">{message.title}</h2>
        <div className="prose prose--quote">
          {message.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
