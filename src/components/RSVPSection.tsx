import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';
import { Emph, Eyebrow } from './Emph';
import { RSVPForm } from './RSVPForm';

export function RSVPSection() {
  const { rsvpCopy, links, confirmationPopup, rsvp, images } = wedding;
  return (
    <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-titulo">
      <div className="rsvp-section__photo">
        <ResponsiveBackground image={images.rsvp} sizes="(min-width: 900px) 45vw, 100vw" />
        <div className="rsvp-section__shade" aria-hidden="true" />
        <blockquote className="rsvp-section__quote">
          <span className="rsvp-section__mark" aria-hidden="true">“</span>
          {rsvpCopy.quote[0]}
          <br />
          {rsvpCopy.quote[1]}
        </blockquote>
      </div>
      <div className="rsvp-section__body">
        <div className="rsvp-section__inner">
          <Eyebrow>{rsvpCopy.eyebrow}</Eyebrow>
          <h2 className="display rsvp-title" id="rsvp-titulo">
            <Emph text={rsvpCopy.title} />
          </h2>
          <div className="rsvp-lead">
            <p>{rsvpCopy.intro}</p>
            <p>
              Confirme sua presença até <strong>{rsvp.deadlineLabel}</strong>, utilizando o código que recebeu no convite.
            </p>
            <p className="rsvp-lead__closing">{rsvpCopy.closing}</p>
          </div>
          <RSVPForm
            successTitle={rsvpCopy.successTitle}
            giftListUrl={links.giftList}
            popup={{ ...confirmationPopup }}
            allowChanges={rsvp.allowChanges}
          />
        </div>
      </div>
    </section>
  );
}
