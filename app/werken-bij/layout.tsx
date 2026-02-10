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
      title: 'Work at HomeCheff - Become a Delivery Driver',
      description: 'Become a delivery driver at HomeCheff and earn flexibly. Deliver homemade products in your neighborhood and set your own working hours.',
      openGraph: {
        title: 'Work at HomeCheff - Become a Delivery Driver',
        description: 'Become a delivery driver at HomeCheff and earn flexibly. Deliver homemade products in your neighborhood.',
        type: 'website',
        url: `${currentDomain}/werken-bij`,
      },
      alternates: {
        canonical: `${currentDomain}/werken-bij`,
        languages: {
          'nl-NL': 'https://homecheff.nl/werken-bij',
          'en-US': 'https://homecheff.eu/werken-bij',
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Werken bij HomeCheff - Word Bezorger',
    description: 'Word bezorger bij HomeCheff en verdien flexibel bij. Bezorg thuisgemaakte producten in jouw buurt en bepaal zelf je werktijden.',
    openGraph: {
      title: 'Werken bij HomeCheff - Word Bezorger',
      description: 'Word bezorger bij HomeCheff en verdien flexibel bij. Bezorg thuisgemaakte producten in jouw buurt.',
      type: 'website',
      url: `${currentDomain}/werken-bij`,
    },
    alternates: {
      canonical: `${currentDomain}/werken-bij`,
      languages: {
        'nl-NL': 'https://homecheff.nl/werken-bij',
        'en-US': 'https://homecheff.eu/werken-bij',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function WerkenBijLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

