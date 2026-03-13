import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, NL_DOMAIN } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');

  let lang: 'nl' | 'en' = 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    lang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    lang = languageCookie.value as 'nl' | 'en';
  }

  const currentDomain = MAIN_DOMAIN;

  if (lang === 'en') {
    return {
      title: 'About Us - HomeCheff',
      description: 'Who we are, our mission and how to reach us. Contact addresses for info, support, partners, press, jobs and team.',
      openGraph: {
        title: 'About Us - HomeCheff',
        description: 'Who we are and how to reach us.',
        type: 'website',
        url: `${currentDomain}/over-ons`,
      },
      alternates: {
        canonical: `${currentDomain}/over-ons`,
        languages: {
          'nl-NL': `${NL_DOMAIN}/over-ons`,
          'en-US': `${MAIN_DOMAIN}/over-ons`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: 'Over ons - HomeCheff',
    description: 'Wie we zijn, onze missie en hoe je ons bereikt. Contactadressen voor info, support, partners, pers, vacatures en team.',
    openGraph: {
      title: 'Over ons - HomeCheff',
      description: 'Wie we zijn en hoe je ons bereikt.',
      type: 'website',
      url: `${currentDomain}/over-ons`,
    },
    alternates: {
      canonical: `${currentDomain}/over-ons`,
      languages: {
        'nl-NL': 'https://homecheff.nl/over-ons',
        'en-US': 'https://homecheff.eu/over-ons',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function OverOnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
