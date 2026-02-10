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
      title: 'Privacy Policy - HomeCheff',
      description: 'Read our privacy policy. Your privacy and security are our priority. Discover how we protect your data.',
      openGraph: {
        title: 'Privacy Policy - HomeCheff',
        description: 'Read our privacy policy. Your privacy and security are our priority.',
        type: 'website',
        url: `${currentDomain}/privacy`,
      },
      alternates: {
        canonical: `${currentDomain}/privacy`,
        languages: {
          'nl-NL': 'https://homecheff.nl/privacy',
          'en-US': 'https://homecheff.eu/privacy',
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Privacybeleid - HomeCheff',
    description: 'Lees ons privacybeleid. Jouw privacy en veiligheid zijn onze prioriteit. Ontdek hoe we jouw gegevens beschermen.',
    openGraph: {
      title: 'Privacybeleid - HomeCheff',
      description: 'Lees ons privacybeleid. Jouw privacy en veiligheid zijn onze prioriteit.',
      type: 'website',
      url: `${currentDomain}/privacy`,
    },
    alternates: {
      canonical: `${currentDomain}/privacy`,
      languages: {
        'nl-NL': 'https://homecheff.nl/privacy',
        'en-US': 'https://homecheff.eu/privacy',
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

