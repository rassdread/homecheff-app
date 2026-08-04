import type { Metadata } from 'next';
import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

/** English discoverability alias — same pillar content, EN metadata + hreflang. */
export async function generateMetadata(): Promise<Metadata> {
  return buildPillarLandingMetadata('/wat-is-homecheff', 'en');
}

export default function EnglishWhatIsHomeCheffPage() {
  return <PillarLandingPage path="/wat-is-homecheff" />;
}
