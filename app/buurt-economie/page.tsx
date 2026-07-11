import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/buurt-economie';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function BuurtEconomiePage() {
  return <PillarLandingPage path={PATH} />;
}
