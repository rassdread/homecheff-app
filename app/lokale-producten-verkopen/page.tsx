import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/lokale-producten-verkopen';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'localProductsPage');
}

export default function LokaleProductenVerkopenLandingPage() {
  return <ProgrammaticSeoLandingPage namespace="localProductsPage" />;
}
