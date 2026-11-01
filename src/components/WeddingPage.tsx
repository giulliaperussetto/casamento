import { WeddingHero } from './WeddingHero';
import { OurStory } from './OurStory';
import { CelebrationDetails } from './CelebrationDetails';
import { DressCode } from './DressCode';
import { PartySection } from './PartySection';
import { PlaylistTracks } from './PlaylistTracks';
import { GuestMission } from './GuestMission';
import { GiftsSection } from './GiftsSection';
import { RSVPSection } from './RSVPSection';
import { FAQAccordion } from './FAQAccordion';
import { WeddingFooter } from './WeddingFooter';

/** Página única, rolagem vertical natural, seções na ordem definida. */
export function WeddingPage({ initialCode }: { initialCode?: string }) {
  return (
    <>
      <WeddingHero />
      <main>
        <OurStory />
        <CelebrationDetails />
        <DressCode />
        <div className="frame frame--party">
          <PartySection />
        </div>
        <PlaylistTracks />
        <GuestMission />
        <GiftsSection />
        <RSVPSection initialCode={initialCode} />
        <FAQAccordion />
      </main>
      <div className="frame frame--footer">
        <WeddingFooter />
      </div>
    </>
  );
}
