import { Suspense } from 'react';
import DiscoverHubClient from '@/components/discover/DiscoverHubClient';
import type { Metadata } from 'next';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();

  if (lang === 'en') {
    return {
      title: 'Discover - HomeCheff',
      description: 'Discover inspiration and village-square listings near you — recipes, harvests, designs and local products. One place to explore HomeCheff.',
      keywords: [
        'HomeCheff inspiration', 'homecheff recipes', 'homecheff ideas',
        'homemade recipes', 'local inspiration', 'neighborhood recipes',
        'fresh harvest ideas', 'handmade creations', 'local cooking inspiration',
        'HomeCheff', 'homecheff', 'local marketplace inspiration',
      ],
      openGraph: {
        title: 'Discover - HomeCheff',
        description: 'Discover inspiration and village-square listings near you — recipes, harvests, designs and local products.',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}/inspiratie`,
        siteName: 'HomeCheff',
      },
      alternates: {
        canonical: `${currentDomain}/inspiratie`,
        languages: seoHreflangLanguagesOnEu('/inspiratie'),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Ontdekken - HomeCheff',
    description: 'Ontdek inspiratie en dorpsplein-aanbiedingen bij jou in de buurt — recepten, oogst, designs en lokale producten. Eén plek om HomeCheff te verkennen.',
    keywords: [
      'HomeCheff inspiratie', 'homecheff recepten', 'homecheff ideeën',
      'thuisgemaakte recepten', 'lokale inspiratie', 'buurt recepten',
      'verse oogst ideeën', 'handgemaakte creaties', 'lokaal koken inspiratie',
      'HomeCheff', 'homecheff', 'lokale marktplaats inspiratie',
    ],
    openGraph: {
      title: 'Ontdekken - HomeCheff',
      description: 'Ontdek inspiratie en dorpsplein-aanbiedingen bij jou in de buurt — recepten, oogst, designs en lokale producten.',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}/inspiratie`,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical: `${currentDomain}/inspiratie`,
      languages: seoHreflangLanguagesOnEu('/inspiratie'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function InspiratiePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">We halen de nieuwste inspiratie op van je buurt...</p>
        </div>
      </div>
    }>
      <DiscoverHubClient />
    </Suspense>
  );
}

