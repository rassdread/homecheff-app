import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/persoonlijk-vakmanschap';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function PersoonlijkVakmanschapPage() {
  return <PillarLandingPage path={PATH} />;
}
