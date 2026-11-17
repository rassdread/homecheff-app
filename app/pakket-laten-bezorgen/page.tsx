import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';
import { CUSTOMER_PUBLIC_PATHS, deliveryPublicLanguages } from '@/lib/seo/delivery-public';

const PATH = CUSTOMER_PUBLIC_PATHS.nl;

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'localDeliveryPage', undefined, {
    language: 'nl',
    languages: deliveryPublicLanguages(CUSTOMER_PUBLIC_PATHS),
  });
}

export default function PakketLatenBezorgenPage() {
  return (
    <ProgrammaticSeoLandingPage
      namespace="localDeliveryPage"
      contentLanguage="nl"
      pagePath={PATH}
    />
  );
}
