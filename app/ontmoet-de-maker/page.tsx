import PillarLandingPage from '@/components/seo/PillarLandingPage';
import { buildPillarLandingMetadata } from '@/lib/seo/buildPillarMetadata';

const PATH = '/ontmoet-de-maker';

export async function generateMetadata() {
  return buildPillarLandingMetadata(PATH);
}

export default function OntmoetDeMakerPage() {
  return <PillarLandingPage path={PATH} />;
}
