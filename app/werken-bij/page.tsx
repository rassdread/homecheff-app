import { cookies, headers } from 'next/headers';
import VerdienHubPage from '@/components/verdien/VerdienHubPage';
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

/**
 * Server entry for /werken-bij — passes hub copy so first paint is never empty
 * (client-only useTranslation returns '' until /i18n/*.json loads).
 */
export default async function WerkenBijPage() {
  const lang = await resolveHubLang();
  return <VerdienHubPage copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
