import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/alternatief-voor-dropshipping';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'dropshippingAlternativePage');
}

export default function AlternatiefVoorDropshippingLandingPage() {
  return <ProgrammaticSeoLandingPage namespace="dropshippingAlternativePage" />;
}
