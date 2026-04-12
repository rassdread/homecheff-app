import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/unieke-producten-verkopen';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'uniqueProductsPage');
}

export default function UniekeProductenVerkopenLandingPage() {
  return <ProgrammaticSeoLandingPage namespace="uniqueProductsPage" />;
}
