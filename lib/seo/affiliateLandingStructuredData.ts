import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';

/** FAQPage JSON-LD for /affiliate. Same questions as the visible FAQ. */
export function getAffiliateLandingFaqJsonLd(
  lang: 'nl' | 'en',
  pairs = affiliatePropositionFaqs(lang),
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
