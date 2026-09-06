import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';

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
      title: 'Earn with HomeCheff — Sell, deliver, promote or join',
      description:
        'See how you can participate in HomeCheff: sell what you make, deliver locally, become an affiliate or Affiliate Company, discover Studio and Growth, or view real HomeCheff jobs.',
      openGraph: {
        title: 'Earn with HomeCheff',
        description:
          'Sell, deliver, promote HomeCheff, or explore Studio and Growth. Share opportunities with attribution when you are an affiliate.',
        type: 'website',
        url: `${currentDomain}/werken-bij`,
      },
      alternates: {
        canonical: `${currentDomain}/werken-bij`,
        languages: seoHreflangLanguagesOnEu('/werken-bij'),
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'Verdien met HomeCheff — Verkoop, bezorg, promoot of werk mee',
    description:
      'Ontdek hoe je meedoet met HomeCheff: verkoop wat je maakt, bezorg lokaal, word affiliate of Affiliate Company, ontdek Studio en Growth, of bekijk echte vacatures bij HomeCheff.',
    openGraph: {
      title: 'Verdien met HomeCheff',
      description:
        'Verkoop, bezorg, promoot HomeCheff of ontdek Studio en Growth. Deel kansen met affiliate-attributie wanneer je affiliate bent.',
      type: 'website',
      url: `${currentDomain}/werken-bij`,
    },
    alternates: {
      canonical: `${currentDomain}/werken-bij`,
      languages: seoHreflangLanguagesOnEu('/werken-bij'),
    },
    robots: { index: true, follow: true },
  };
}

export default function WerkenBijLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
