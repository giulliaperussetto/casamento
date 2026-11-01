import { wedding } from '@/config/wedding';
import { ResponsiveBackground } from './ResponsiveBackground';

export function RingsPhoto() {
  return (
    <section className="photo-band" aria-label="As alianças">
      <ResponsiveBackground image={wedding.images.rings} />
    </section>
  );
}
