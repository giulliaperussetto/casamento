import { wedding } from '@/config/wedding';
import { Ornament } from './Ornament';
import { RSVPForm } from './RSVPForm';

export function RSVPSection() {
  const { rsvpCopy, links, giftPrompt, rsvp } = wedding;
  return (
    <section className="section section--marsala" id="rsvp" aria-labelledby="rsvp-titulo">
      <div className="container container--form center">
        <Ornament className="ornament--gold" />
        <h2 className="title title--light" id="rsvp-titulo">{rsvpCopy.title}</h2>
        <p className="lead lead--light">{rsvpCopy.text}</p>
        <p className="deadline">Confirme até {rsvp.deadlineLabel}</p>
        <RSVPForm
          copy={{ ...rsvpCopy }}
          giftListUrl={links.giftList}
          gift={{ first: { ...giftPrompt.first }, second: { ...giftPrompt.second } }}
          allowChanges={rsvp.allowChanges}
        />
      </div>
    </section>
  );
}
