import { WeddingHero } from '@/components/WeddingHero';
import { RingsPhoto } from '@/components/RingsPhoto';
import { WeddingMessage } from '@/components/WeddingMessage';
import { OurStory } from '@/components/OurStory';
import { CelebrationDetails } from '@/components/CelebrationDetails';
import { DressCode } from '@/components/DressCode';
import { WeddingTimeline } from '@/components/WeddingTimeline';
import { PartySection } from '@/components/PartySection';
import { PlaylistInvitation } from '@/components/PlaylistInvitation';
import { GuestMission } from '@/components/GuestMission';
import { RSVPSection } from '@/components/RSVPSection';
import { FAQAccordion } from '@/components/FAQAccordion';
import { WeddingFooter } from '@/components/WeddingFooter';

/** Página única, rolagem vertical natural, seções na ordem definida. */
export default function Home() {
  return (
    <>
      <WeddingHero />
      <main>
        <RingsPhoto />
        <WeddingMessage />
        <OurStory />
        <CelebrationDetails />
        <DressCode />
        <WeddingTimeline />
        <PartySection />
        <PlaylistInvitation />
        <GuestMission />
        <RSVPSection />
        <FAQAccordion />
      </main>
      <WeddingFooter />
    </>
  );
}
