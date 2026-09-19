import type { Metadata } from 'next';
import VacaturesPageClient from '@/components/verdien/VacaturesPageClient';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { MAIN_DOMAIN, getCurrentLanguage, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const og = buildOpportunityOpenGraphMetadata('jobs', lang, MAIN_DOMAIN);
  return {
    ...og,
    alternates: {
      canonical: `${MAIN_DOMAIN}/werken-bij/vacatures`,
      languages: seoHreflangLanguagesOnEu('/werken-bij/vacatures'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function VacaturesPage() {
  const lang = await getCurrentLanguage();
  return <VacaturesPageClient copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
