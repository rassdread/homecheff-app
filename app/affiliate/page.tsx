import AffiliatePageClient from './page-client';
import type { Metadata } from 'next';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const path = '/affiliate';

  const keywordsEn = [
    'HomeCheff affiliate',
    'HomeCheff partner',
    'ecosystem affiliate',
    'Marketplace Growth Studio',
    'affiliate programme',
    'creator partnerships',
    'referral programme',
    'Stripe Connect payouts',
    'promo codes',
  ];

  const keywordsNl = [
    'HomeCheff affiliate',
    'HomeCheff partner',
    'ecosysteem affiliate',
    'Marketplace Growth Studio',
    'affiliate programma',
    'creator partnerships',
    'referral programma',
    'Stripe Connect uitbetaling',
    'promocodes',
  ];

  if (lang === 'en') {
    return {
      title: 'Affiliate & partners across HomeCheff | Marketplace, Growth, Studio',
      description:
        'Promote HomeCheff across the ecosystem where the partner programme supports it — Marketplace, Growth and Studio. Exact commissions live in your agreement; weekly Stripe payouts where applicable. No guaranteed income.',
      keywords: keywordsEn,
      openGraph: {
        title: 'HomeCheff affiliate — ecosystem-wide partners',
        description:
          'Affiliate and referral participation across Marketplace, Growth and Studio where supported. Exact percentages live in the applicable agreement — no universal promise.',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}${path}`,
        siteName: 'HomeCheff',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'HomeCheff affiliate & partners',
        description:
          'Ecosystem-wide promotion and referral where supported. Terms in your agreement — no guaranteed income.',
      },
      alternates: {
        canonical: `${currentDomain}${path}`,
        languages: seoHreflangLanguagesOnEu(path),
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'Affiliate & partners over HomeCheff | Marketplace, Growth, Studio',
    description:
      'Promoot HomeCheff over het ecosysteem waar het partnerprogramma dat toestaat — Marketplace, Growth en Studio. Exacte commissies staan in je overeenkomst; wekelijkse Stripe-uitbetalingen waar van toepassing. Geen gegarandeerd inkomen.',
    keywords: keywordsNl,
    openGraph: {
      title: 'HomeCheff affiliate — ecosysteem-brede partners',
      description:
        'Affiliate- en referraldeelname over Marketplace, Growth en Studio waar ondersteund. Exacte percentages staan in de toepasselijke overeenkomst — geen universele belofte.',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}${path}`,
      siteName: 'HomeCheff',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HomeCheff affiliate & partners',
      description:
        'Ecosysteem-brede promotie en referral waar ondersteund. Voorwaarden in je overeenkomst — geen gegarandeerd inkomen.',
    },
    alternates: {
      canonical: `${currentDomain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}

export default async function AffiliatePage() {
  return <AffiliatePageClient />;
}
