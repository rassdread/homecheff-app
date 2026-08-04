import type { ReactNode } from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import { getAffiliateLandingFaqJsonLd } from '@/lib/seo/affiliateLandingStructuredData';

export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  const lang = await getCurrentLanguage();
  const structuredData = getAffiliateLandingFaqJsonLd(lang);

  return (
    <>
      <JsonLdScript id="affiliate-landing-faq-ld" data={structuredData} />
      {children}
    </>
  );
}
