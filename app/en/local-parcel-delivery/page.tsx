import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';
import { CUSTOMER_PUBLIC_PATHS, deliveryPublicLanguages } from '@/lib/seo/delivery-public';

const PATH = CUSTOMER_PUBLIC_PATHS.en;

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'localDeliveryPage', undefined, {
    language: 'en',
    languages: deliveryPublicLanguages(CUSTOMER_PUBLIC_PATHS),
  });
}

export default function LocalParcelDeliveryPage() {
  return (
    <ProgrammaticSeoLandingPage
      namespace="localDeliveryPage"
      contentLanguage="en"
      pagePath={PATH}
    />
  );
}
