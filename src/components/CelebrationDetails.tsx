import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';

export function CelebrationDetails() {
  const { celebration, date, venue, images } = wedding;
  const details = [
    { label: 'Data', value: date.long },
    { label: 'Horário', value: date.time },
    { label: 'Local', value: venue.name },
    { label: 'Endereço', value: venue.address },
  ];
  return (
    <section className="celebration" id="celebracao" aria-labelledby="celebracao-titulo">
      <div className="celebration__photo">
        <ResponsiveBackground image={images.celebration} sizes="(min-width: 900px) 50vw, 100vw" />
      </div>
      <div className="celebration__info">
        <div className="celebration__inner">
          <h2 className="title" id="celebracao-titulo">{celebration.title}</h2>
          <span className="rule" aria-hidden="true" />
          <div className="prose">
            {celebration.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="details">
            {details.map((d) => (
              <div className="details__row" key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
          <a className="btn btn--marsala" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
            {celebration.directionsLabel}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
