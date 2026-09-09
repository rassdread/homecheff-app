import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';

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

  const og = buildOpportunityOpenGraphMetadata('hub', lang, MAIN_DOMAIN);
  const path = '/werken-bij';

  return {
    ...og,
    title:
      lang === 'en'
        ? 'Earn with HomeCheff — Sell, deliver, promote or join'
        : 'Verdien met HomeCheff — Verkoop, bezorg, promoot of werk mee',
    description:
      lang === 'en'
        ? 'See how you can participate in HomeCheff: sell what you make, deliver locally, become an affiliate or Affiliate Company, discover Studio and Growth, or view real HomeCheff jobs.'
        : 'Ontdek hoe je meedoet met HomeCheff: verkoop wat je maakt, bezorg lokaal, word affiliate of Affiliate Company, ontdek Studio en Growth, of bekijk echte vacatures bij HomeCheff.',
    alternates: {
      canonical: `${MAIN_DOMAIN}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
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
