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
      title: 'Contact - HomeCheff',
      description: 'Get in touch with us. Do you have questions, comments or suggestions? We are here for you.',
      openGraph: {
        title: 'Contact - HomeCheff',
        description: 'Get in touch with us. Do you have questions, comments or suggestions?',
        type: 'website',
        url: `${currentDomain}/contact`,
      },
      alternates: {
        canonical: `${currentDomain}/contact`,
        languages: {
          'nl-NL': 'https://homecheff.nl/contact',
          'en-US': 'https://homecheff.eu/contact',
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Contact - HomeCheff',
    description: 'Neem contact met ons op. Heb je vragen, opmerkingen of suggesties? We staan voor je klaar.',
    openGraph: {
      title: 'Contact - HomeCheff',
      description: 'Neem contact met ons op. Heb je vragen, opmerkingen of suggesties?',
      type: 'website',
      url: `${currentDomain}/contact`,
    },
    alternates: {
      canonical: `${currentDomain}/contact`,
      languages: {
        'nl-NL': 'https://homecheff.nl/contact',
        'en-US': 'https://homecheff.eu/contact',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

