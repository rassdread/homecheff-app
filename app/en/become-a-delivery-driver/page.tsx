import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';
import { COURIER_PUBLIC_PATHS, deliveryPublicLanguages } from '@/lib/seo/delivery-public';

const PATH = COURIER_PUBLIC_PATHS.en;

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'deliveryPartnerPage', undefined, {
    language: 'en',
    languages: deliveryPublicLanguages(COURIER_PUBLIC_PATHS),
  });
}

export default function BecomeADeliveryDriverPage() {
  return (
    <ProgrammaticSeoLandingPage
      namespace="deliveryPartnerPage"
      contentLanguage="en"
      pagePath={PATH}
    />
  );
}
