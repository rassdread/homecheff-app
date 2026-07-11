import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/lokaal-verdienen';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function LokaalVerdienenPage() {
  return <PillarLandingPage path={PATH} />;
}
