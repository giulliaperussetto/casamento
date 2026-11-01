import { WeddingHero } from '@/components/WeddingHero';
import { OurStory } from '@/components/OurStory';
import { CelebrationDetails } from '@/components/CelebrationDetails';
import { DressCode } from '@/components/DressCode';
import { PartySection } from '@/components/PartySection';
import { PlaylistTracks } from '@/components/PlaylistTracks';
import { GuestMission } from '@/components/GuestMission';
import { GiftsSection } from '@/components/GiftsSection';
import { RSVPSection } from '@/components/RSVPSection';
import { FAQAccordion } from '@/components/FAQAccordion';
import { WeddingFooter } from '@/components/WeddingFooter';

/** Página única, rolagem vertical natural, seções na ordem definida. */
export default function Home() {
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
        <RSVPSection />
        <FAQAccordion />
      </main>
      <div className="frame frame--footer">
        <WeddingFooter />
      </div>
    </>
  );
}
