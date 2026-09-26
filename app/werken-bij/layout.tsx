import type { Metadata } from 'next';
import { MAIN_DOMAIN, getCurrentLanguage } from '@/lib/seo/metadata';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';
import {
  CAREERS_NL_PATHS,
  careersHreflangLanguages,
} from '@/lib/navigation/public-careers-nav';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const og = buildOpportunityOpenGraphMetadata('hub', lang, MAIN_DOMAIN);
  const path = CAREERS_NL_PATHS.hub;

  return {
    ...og,
    title:
      lang === 'en'
        ? 'Earn with HomeCheff: Sell, deliver, promote or join'
        : 'Verdien met HomeCheff: Verkoop, bezorg, promoot of werk mee',
    description:
      lang === 'en'
        ? 'See how you can take part in HomeCheff: sell, deliver, or build a customer portfolio as a partner alongside your work. Real HomeCheff jobs are listed separately. No guaranteed income.'
        : 'Ontdek hoe je meedoet met HomeCheff: verkopen, bezorgen, of naast je werk een klantenportefeuille opbouwen als partner. Echte vacatures staan apart. Geen gegarandeerd inkomen.',
    alternates: {
      canonical: `${MAIN_DOMAIN}${path}`,
      languages: careersHreflangLanguages('hub'),
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
