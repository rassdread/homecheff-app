import type { Metadata } from 'next';
import VacaturesPageClient from '@/components/verdien/VacaturesPageClient';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { MAIN_DOMAIN, getCurrentLanguage } from '@/lib/seo/metadata';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';
import {
  CAREERS_EN_PATHS,
  careersHreflangLanguages,
} from '@/lib/navigation/public-careers-nav';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const og = buildOpportunityOpenGraphMetadata('jobs', lang, MAIN_DOMAIN);
  return {
    ...og,
    alternates: {
      canonical: `${MAIN_DOMAIN}${CAREERS_EN_PATHS.jobs}`,
      languages: careersHreflangLanguages('jobs'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CareersJobsPage() {
  const lang = await getCurrentLanguage();
  return <VacaturesPageClient copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
