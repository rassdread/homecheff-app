import HomeEarningPageContent from '@/components/seo/HomeEarningPageContent';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/verdienen-zonder-dropshipping';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'homeEarningPage');
}

export default function VerdienenZonderDropshippingPage() {
  return <HomeEarningPageContent />;
}
