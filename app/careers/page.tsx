import VerdienHubPage from '@/components/verdien/VerdienHubPage';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { getCurrentLanguage } from '@/lib/seo/metadata';

export default async function CareersPage() {
  const lang = await getCurrentLanguage();
  return <VerdienHubPage copy={getVerdienHubCopy(lang)} initialLang={lang} />;
}
