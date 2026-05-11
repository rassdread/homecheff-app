import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const path = '/hcp-ranglijsten';

  if (lang === 'en') {
    return {
      title: 'HCP leaderboards',
      description:
        'See HomeCheff Points (HCP) leaderboards near you, by country, or worldwide. Discover active local makers and how community participation is celebrated.',
      alternates: {
        canonical: `${domain}${path}`,
        languages: seoHreflangLanguagesOnEu(path),
      },
      openGraph: {
        title: 'HCP leaderboards | HomeCheff',
        description: 'Local homemade marketplace rankings: nearby, country, and worldwide HCP.',
        url: `${domain}${path}`,
        type: 'website',
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'HCP-ranglijsten',
    description:
      'HomeCheff Points (HCP)-ranglijsten bij jou in de buurt, per land of wereldwijd. Ontdek actieve lokale makers en hoe community-deelname zichtbaar wordt.',
    alternates: {
      canonical: `${domain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    openGraph: {
      title: 'HCP-ranglijsten | HomeCheff',
      description: 'Ranglijsten voor lokale makers: dichtbij, land en wereldwijd.',
      url: `${domain}${path}`,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default function HcpRanglijstenLayout({ children }: { children: ReactNode }) {
  return children;
}
