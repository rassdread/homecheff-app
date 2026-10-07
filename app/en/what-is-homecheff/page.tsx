import type { Metadata } from 'next';
import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

/** English discoverability alias. Copy and metadata stay English on this URL. */
export async function generateMetadata(): Promise<Metadata> {
  return buildPillarLandingMetadata('/wat-is-homecheff', {
    lang: 'en',
    canonicalPath: '/en/what-is-homecheff',
    alternateEnPath: '/en/what-is-homecheff',
  });
}

export default function EnglishWhatIsHomeCheffPage() {
  return (
    <PillarLandingPage
      path="/wat-is-homecheff"
      contentLanguage="en"
      pagePath="/en/what-is-homecheff"
    />
  );
}
