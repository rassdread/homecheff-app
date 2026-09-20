import VerdienHubPage from '@/components/verdien/VerdienHubPage';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import VerdienCheckPublicEntry from '@/components/verdiencheck/VerdienCheckPublicEntry';

export default async function CareersPage() {
  const lang = await getCurrentLanguage();
  return (
    <>
      <VerdienCheckPublicEntry variant="hub" entryPoint="careers" />
      <VerdienHubPage copy={getVerdienHubCopy(lang)} initialLang={lang} />
    </>
  );
}
