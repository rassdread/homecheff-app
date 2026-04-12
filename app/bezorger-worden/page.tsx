import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/bezorger-worden';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'deliveryPartnerPage');
}

export default function BezorgerWordenLandingPage() {
  return <ProgrammaticSeoLandingPage namespace="deliveryPartnerPage" />;
}
