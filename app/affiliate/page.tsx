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
    'affiliate programme',
    'recurring commission',
    'recurring income potential',
    'creator partnerships',
    'long-term partnerships',
    'creator economy',
    'community commerce',
    'recurring income',
    'online income building',
    'affiliate community',
    'local makers affiliate',
    'Stripe Connect payouts',
    'promo codes',
    '12-12 programme',
    'TikTok affiliate',
    'Instagram referral',
  ];

  const keywordsNl = [
    'HomeCheff affiliate',
    'affiliate programma',
    'terugkerende commissie',
    'terugkerende inkomsten',
    'recurring inkomsten',
    'creator partnerships',
    'langdurige samenwerkingen',
    'creator economy',
    'community commerce',
    'online inkomsten opbouwen',
    'affiliate community',
    'referral inkomsten',
    'lokale creators',
    'Stripe Connect uitbetaling',
    'promocodes',
    '12-12 programma',
    'TikTok promotie',
    'Instagram referral',
  ];

  if (lang === 'en') {
    return {
      title: 'Affiliate programme for creators & communities | HomeCheff',
      description:
        'Partner with HomeCheff: the first twelve months per active referred subscription are defined in the standard commission model; weekly Stripe payouts and tools for long-term creator and community partnerships.',
      keywords: keywordsEn,
      openGraph: {
        title: 'HomeCheff affiliate — creators & community growth',
        description:
          'Transparent affiliate terms: standard recurring commission window per active business, with room for partnership evolution over time — plus tools for creators, agencies, and communities.',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}${path}`,
        siteName: 'HomeCheff',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'HomeCheff affiliate programme',
        description: 'Recurring commission, long-term creator partnerships, Stripe payouts, and growth tools for communities.',
      },
      alternates: {
        canonical: `${currentDomain}${path}`,
        languages: seoHreflangLanguagesOnEu(path),
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'Affiliateprogramma voor creators & communities | HomeCheff',
    description:
      'Partner met HomeCheff: de eerste twaalf maanden per actief aangebracht abonnement vallen binnen het standaard commissiemodel; wekelijkse Stripe-uitbetalingen en tools voor langdurige creator- en community-samenwerkingen.',
    keywords: keywordsNl,
    openGraph: {
      title: 'HomeCheff affiliate — growth voor creators & community',
      description:
        'Heldere affiliate-voorwaarden: standaard terugkerend commissievenster per actief bedrijf, met ruimte voor evolutie van partnerships — plus tools voor creators, agencies en communities.',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}${path}`,
      siteName: 'HomeCheff',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HomeCheff affiliateprogramma',
      description: 'Terugkerende commissie, langdurige creator partnerships, Stripe-uitbetalingen en schaalbare community tools.',
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
