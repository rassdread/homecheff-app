import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/wat-is-homecheff';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function WatIsHomecheffPage() {
  return <PillarLandingPage path={PATH} />;
}
