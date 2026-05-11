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
    'creator economy',
    'community commerce',
    'referral income',
    'side income creators',
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
    'creator economy',
    'community commerce',
    'referral inkomsten',
    'online inkomsten creators',
    'lokale creators',
    'social media verdienen',
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
        'Partner with HomeCheff: clear recurring commission on referrals, weekly Stripe payouts, personal links and promo codes. Built for creators, local networks, and agencies — not hype.',
      keywords: keywordsEn,
      openGraph: {
        title: 'HomeCheff affiliate — creators & community growth',
        description:
          'Earn with a local homemade marketplace: transparent fees, up to 12 months subscription share per business, tools in your dashboard.',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}${path}`,
        siteName: 'HomeCheff',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'HomeCheff affiliate programme',
        description: 'Recurring commission, Stripe payouts, links & promo codes for creators and communities.',
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
      'Partner worden bij HomeCheff: heldere terugkerende commissie op referrals, wekelijkse uitbetaling via Stripe, eigen links en promocodes. Voor creators, lokale netwerken en agencies — zonder hype.',
    keywords: keywordsNl,
    openGraph: {
      title: 'HomeCheff affiliate — growth voor creators & community',
      description:
        'Verdien met een lokale marktplaats voor thuisgemaakt: transparante fees, tot twaalf maanden abonnementsdeel per bedrijf, tools in je dashboard.',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}${path}`,
      siteName: 'HomeCheff',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HomeCheff affiliateprogramma',
      description: 'Terugkerende commissie, Stripe-uitbetalingen, links en promocodes voor creators en communities.',
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
