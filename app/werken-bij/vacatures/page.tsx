import { cookies, headers } from 'next/headers';
import VacaturesPageClient from '@/components/verdien/VacaturesPageClient';
import {
  getVerdienHubCopy,
  type VerdienHubLang,
} from '@/lib/i18n/verdienHubSources';

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

export default async function VacaturesPage() {
  const lang = await resolveHubLang();
  return <VacaturesPageClient copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
