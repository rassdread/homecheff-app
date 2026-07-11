import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/wat-we-niet-zijn';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function WatWeNietZijnPage() {
  return <PillarLandingPage path={PATH} />;
}
