import VerdienHubPage from '@/components/verdien/VerdienHubPage';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import VerdienCheckPublicEntry from '@/components/verdiencheck/VerdienCheckPublicEntry';

/**
 * Server entry for /werken-bij — passes hub copy so first paint is never empty
 * (client-only useTranslation returns '' until /i18n/*.json loads).
 */
export default async function WerkenBijPage() {
  const lang = await getCurrentLanguage();
  return (
    <>
      <VerdienCheckPublicEntry variant="hub" entryPoint="werken-bij" />
      <VerdienHubPage copy={getVerdienHubCopy(lang)} initialLang={lang} />
    </>
  );
}
