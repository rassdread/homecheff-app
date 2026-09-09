import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import VacaturesPageClient from '@/components/verdien/VacaturesPageClient';
import {
  getVerdienHubCopy,
  type VerdienHubLang,
} from '@/lib/i18n/verdienHubSources';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';

async function resolveHubLang(): Promise<VerdienHubLang> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  if (languageHeader === 'nl' || languageHeader === 'en') return languageHeader;
  if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    return languageCookie.value;
  }
  return 'nl';
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await resolveHubLang();
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
  const lang = await resolveHubLang();
  return <VacaturesPageClient copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
