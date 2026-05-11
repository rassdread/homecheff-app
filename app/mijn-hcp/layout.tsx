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
  const path = '/mijn-hcp';

  if (lang === 'en') {
    return {
      title: 'My HCP',
      description:
        'Your HomeCheff Points (HCP), badges, streaks, and a preview of leaderboards. Track how your local marketplace activity grows over time.',
      alternates: {
        canonical: `${domain}${path}`,
        languages: seoHreflangLanguagesOnEu(path),
      },
      openGraph: {
        title: 'My HCP | HomeCheff',
        description: 'Progress, badges, and rankings preview for local makers.',
        url: `${domain}${path}`,
        type: 'website',
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'Mijn HCP',
    description:
      'Jouw HomeCheff Points (HCP), badges, streaks en een voorproefje van de ranglijsten. Zie hoe je activiteit op de lokale marktplaats groeit.',
    alternates: {
      canonical: `${domain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    openGraph: {
      title: 'Mijn HCP | HomeCheff',
      description: 'Voortgang, badges en ranglijsten voor lokale makers.',
      url: `${domain}${path}`,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default function MijnHcpLayout({ children }: { children: ReactNode }) {
  return children;
}
