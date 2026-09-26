import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';

/** FAQPage JSON-LD for /affiliate. Same questions as the visible FAQ. */
export function getAffiliateLandingFaqJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const pairs = affiliatePropositionFaqs(lang);
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
