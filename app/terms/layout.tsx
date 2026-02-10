import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

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
  
  const hostname = headersList.get('host') || '';
  const currentDomain = hostname.includes('homecheff.eu') ? 'https://homecheff.eu' : 'https://homecheff.nl';
  
  if (lang === 'en') {
    return {
      title: 'Terms and Conditions - HomeCheff',
      description: 'Read the terms and conditions of HomeCheff. All rules and conditions for using our platform.',
      openGraph: {
        title: 'Terms and Conditions - HomeCheff',
        description: 'Read the terms and conditions of HomeCheff.',
        type: 'website',
        url: `${currentDomain}/terms`,
      },
      alternates: {
        canonical: `${currentDomain}/terms`,
        languages: {
          'nl-NL': 'https://homecheff.nl/terms',
          'en-US': 'https://homecheff.eu/terms',
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Algemene Voorwaarden - HomeCheff',
    description: 'Lees de algemene voorwaarden van HomeCheff. Alle regels en voorwaarden voor gebruik van ons platform.',
    openGraph: {
      title: 'Algemene Voorwaarden - HomeCheff',
      description: 'Lees de algemene voorwaarden van HomeCheff.',
      type: 'website',
      url: `${currentDomain}/terms`,
    },
    alternates: {
      canonical: `${currentDomain}/terms`,
      languages: {
        'nl-NL': 'https://homecheff.nl/terms',
        'en-US': 'https://homecheff.eu/terms',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

