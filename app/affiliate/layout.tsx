import type { ReactNode } from 'react';
import Script from 'next/script';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import { getAffiliateLandingFaqJsonLd } from '@/lib/seo/affiliateLandingStructuredData';

export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  const lang = await getCurrentLanguage();
  const structuredData = getAffiliateLandingFaqJsonLd(lang);

  return (
    <>
      <Script
        id="affiliate-landing-faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
