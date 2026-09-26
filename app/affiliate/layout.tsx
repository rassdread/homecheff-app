import type { ReactNode } from 'react';
import Script from 'next/script';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import { getAffiliateLandingFaqJsonLd } from '@/lib/seo/affiliateLandingStructuredData';
import { loadPublicPresentation } from '@/lib/affiliate/program-store';
import { publicFaqs } from '@/lib/affiliate/program-control';
import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';

export const dynamic = 'force-dynamic';

export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  const lang = await getCurrentLanguage();
  const presentation = await loadPublicPresentation('NL').catch(() => null);
  const rights = {
    main: presentation?.publicMain ?? true,
    network: presentation?.publicNetwork ?? true,
    promo: presentation?.publicPromo ?? true,
  };
  const structuredData = getAffiliateLandingFaqJsonLd(lang, publicFaqs(affiliatePropositionFaqs(lang), rights));

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
