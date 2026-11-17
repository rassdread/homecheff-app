import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';
import { COURIER_PUBLIC_PATHS, deliveryPublicLanguages } from '@/lib/seo/delivery-public';

const PATH = COURIER_PUBLIC_PATHS.nl;

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'deliveryPartnerPage', undefined, {
    language: 'nl',
    languages: deliveryPublicLanguages(COURIER_PUBLIC_PATHS),
  });
}

export default function BezorgerWordenLandingPage() {
  return (
    <ProgrammaticSeoLandingPage
      namespace="deliveryPartnerPage"
      contentLanguage="nl"
      pagePath={PATH}
    />
  );
}
