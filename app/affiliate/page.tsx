import AffiliatePageClient from './page-client';
import type { Metadata } from 'next';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';
  
  if (lang === 'en') {
    return {
      title: 'Affiliate 12-12 Program - HomeCheff',
      description: 'Join the HomeCheff Affiliate 12-12 Program. For 12 months, you get 12 months of the percentages. Earn commission by bringing users and businesses to HomeCheff.',
      keywords: [
        'HomeCheff affiliate', 'affiliate program', '12-12 program', 'affiliate marketing',
        'earn commission', 'passive income', 'referral program', 'HomeCheff commissions',
        'affiliate 12-12', 'HomeCheff affiliate program', 'referral income',
      ],
      openGraph: {
        title: 'Affiliate 12-12 Program - HomeCheff',
        description: 'Join the HomeCheff Affiliate 12-12 Program. For 12 months, you get 12 months of the percentages. Earn commission by bringing users and businesses.',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}/affiliate`,
        siteName: 'HomeCheff',
      },
      alternates: {
        canonical: `${currentDomain}/affiliate`,
        languages: {
          'nl-NL': `${alternateDomain}/affiliate`,
          'en-US': `${currentDomain}/affiliate`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Affiliate 12-12 Programma - HomeCheff',
    description: 'Word affiliate bij HomeCheff 12-12 Programma. Voor 12 maanden lang krijg je 12 maanden de percentages. Verdien commissie door gebruikers en bedrijven aan te brengen bij HomeCheff.',
    keywords: [
      'HomeCheff affiliate', 'affiliate programma', '12-12 programma', 'affiliate marketing',
      'verdien commissie', 'passief inkomen', 'referral programma', 'HomeCheff commissies',
      'affiliate 12-12', 'HomeCheff affiliate programma', 'referral inkomen',
    ],
    openGraph: {
      title: 'Affiliate 12-12 Programma - HomeCheff',
      description: 'Word affiliate bij HomeCheff 12-12 Programma. Voor 12 maanden lang krijg je 12 maanden de percentages. Verdien commissie door gebruikers en bedrijven aan te brengen.',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}/affiliate`,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical: `${currentDomain}/affiliate`,
      languages: {
        'nl-NL': `${currentDomain}/affiliate`,
        'en-US': `${alternateDomain}/affiliate`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AffiliatePage() {
  // Page is public and accessible to everyone - even affiliates
  // This allows affiliates to share the page and show it to others
  // No redirect to dashboard - users can navigate there manually if they want
  return <AffiliatePageClient />;
}

