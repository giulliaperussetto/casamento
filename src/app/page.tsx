import { WeddingHero } from '@/components/WeddingHero';
import { CelebrationDetails } from '@/components/CelebrationDetails';
import { DressCode } from '@/components/DressCode';
import { PartySection } from '@/components/PartySection';
import { GiftsSection } from '@/components/GiftsSection';
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
        <CelebrationDetails />
        <DressCode />
        <PartySection />
        <GiftsSection />
        <GuestMission />
        <RSVPSection />
        <FAQAccordion />
      </main>
      <WeddingFooter />
    </>
  );
}
