import { Suspense } from 'react';
import InspiratieContent from '@/components/inspiratie/InspiratieContent';
import type { Metadata } from 'next';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';
  
  if (lang === 'en') {
    return {
      title: 'Inspiration - HomeCheff',
      description: 'Discover what\'s happening in your neighborhood — recipes, fresh harvests and unique creations from people around you. HomeCheff inspiration page.',
      keywords: [
        'HomeCheff inspiration', 'homecheff recipes', 'homecheff ideas',
        'homemade recipes', 'local inspiration', 'neighborhood recipes',
        'fresh harvest ideas', 'handmade creations', 'local cooking inspiration',
        'HomeCheff', 'homecheff', 'local marketplace inspiration',
      ],
      openGraph: {
        title: 'Inspiration - HomeCheff',
        description: 'Discover what\'s happening in your neighborhood — recipes, fresh harvests and unique creations from people around you',
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        url: `${currentDomain}/inspiratie`,
        siteName: 'HomeCheff',
      },
      alternates: {
        canonical: `${currentDomain}/inspiratie`,
        languages: {
          'nl-NL': `${alternateDomain}/inspiratie`,
          'en-US': `${currentDomain}/inspiratie`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Inspiratie - HomeCheff',
    description: 'Ontdek wat er leeft in jouw buurt — recepten, verse oogst en unieke creaties van mensen om je heen. HomeCheff inspiratie pagina.',
    keywords: [
      'HomeCheff inspiratie', 'homecheff recepten', 'homecheff ideeën',
      'thuisgemaakte recepten', 'lokale inspiratie', 'buurt recepten',
      'verse oogst ideeën', 'handgemaakte creaties', 'lokaal koken inspiratie',
      'HomeCheff', 'homecheff', 'lokale marktplaats inspiratie',
    ],
    openGraph: {
      title: 'Inspiratie - HomeCheff',
      description: 'Ontdek wat er leeft in jouw buurt — recepten, verse oogst en unieke creaties van mensen om je heen',
      type: 'website',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      url: `${currentDomain}/inspiratie`,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical: `${currentDomain}/inspiratie`,
      languages: {
        'nl-NL': `${currentDomain}/inspiratie`,
        'en-US': `${alternateDomain}/inspiratie`,
      },
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
      <InspiratieContent />
    </Suspense>
  );
}

