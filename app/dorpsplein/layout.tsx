import type { Metadata } from 'next';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';
  
  if (lang === 'en') {
    return {
      title: 'Village Square - HomeCheff',
      description: 'Discover local makers and their unique products on the Village Square. Find homemade products, recipes and designs in your neighborhood. HomeCheff marketplace.',
      keywords: [
        'HomeCheff village square', 'homecheff marketplace', 'homecheff local',
        'local makers', 'homemade products', 'neighborhood market',
        'local marketplace', 'buy local', 'support local makers',
        'HomeCheff', 'homecheff', 'local products', 'community marketplace',
      ],
      openGraph: {
        title: 'Village Square - HomeCheff',
        description: 'Discover local makers and their unique products on the Village Square. HomeCheff marketplace.',
        type: 'website',
        url: `${currentDomain}/dorpsplein`,
        siteName: 'HomeCheff',
      },
      alternates: {
        canonical: `${currentDomain}/dorpsplein`,
        languages: {
          'nl-NL': `${alternateDomain}/dorpsplein`,
          'en-US': `${currentDomain}/dorpsplein`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Dorpsplein - HomeCheff',
    description: 'Ontdek lokale makers en hun unieke producten op het Dorpsplein. Vind thuisgemaakte producten, recepten en designs in jouw buurt. HomeCheff marktplaats.',
    keywords: [
      'HomeCheff dorpsplein', 'homecheff marktplaats', 'homecheff lokaal',
      'lokale makers', 'thuisgemaakte producten', 'buurtmarkt',
      'lokale marktplaats', 'lokaal kopen', 'steun lokale makers',
      'HomeCheff', 'homecheff', 'lokale producten', 'community marktplaats',
    ],
    openGraph: {
      title: 'Dorpsplein - HomeCheff',
      description: 'Ontdek lokale makers en hun unieke producten op het Dorpsplein. HomeCheff marktplaats.',
      type: 'website',
      url: `${currentDomain}/dorpsplein`,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical: `${currentDomain}/dorpsplein`,
      languages: {
        'nl-NL': `${currentDomain}/dorpsplein`,
        'en-US': `${alternateDomain}/dorpsplein`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function DorpspleinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

