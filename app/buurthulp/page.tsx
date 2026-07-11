import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/buurthulp';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function BuurthulpPage() {
  return <PillarLandingPage path={PATH} />;
}
