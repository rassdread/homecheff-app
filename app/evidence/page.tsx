import { cookies, headers } from 'next/headers';
import EvidenceDashboard from '@/components/living-platform/EvidenceDashboard';
import LivingPlatformJsonLd from '@/components/living-platform/LivingPlatformJsonLd';
import LivingPlatformPageShell from '@/components/living-platform/LivingPlatformPageShell';
import { buildLivingPlatformMetadata } from '@/lib/living-platform/build-living-platform-metadata';
import { getEvidenceSnapshot } from '@/lib/living-platform/evidence-queries';
import {
  LIVING_PLATFORM_NAMESPACES,
  LIVING_PLATFORM_PATHS,
} from '@/lib/living-platform/registry';
import { lpMeta, lpShared, resolveLivingPlatformLang } from '@/lib/living-platform/server-i18n';

export const revalidate = 300;

export async function generateMetadata() {
  return buildLivingPlatformMetadata(
    LIVING_PLATFORM_PATHS.evidence,
    LIVING_PLATFORM_NAMESPACES.evidence,
  );
}

export default async function EvidencePage() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const lang = resolveLivingPlatformLang(
    headersList.get('X-HomeCheff-Language'),
    cookieStore.get('homecheff-language')?.value,
  );

  const snapshot = await getEvidenceSnapshot();
  const meta = lpMeta(LIVING_PLATFORM_NAMESPACES.evidence, lang);
  const emptyLabel = lpShared('emptyModule', lang);

  const itemListItems = [
    ...snapshot.recentMakers,
    ...snapshot.recentListings,
    ...snapshot.recentInspiration,
    ...snapshot.recentRequests,
    ...snapshot.recentBarterListings,
    ...snapshot.activeCities,
    ...snapshot.categoryActivity,
  ].map((item) => ({ name: item.label, url: item.href }));

  return (
    <>
      <LivingPlatformJsonLd
        kind="itemList"
        path={LIVING_PLATFORM_PATHS.evidence}
        name={meta.title}
        description={meta.description}
        items={itemListItems}
      />
      <LivingPlatformPageShell
        ns={LIVING_PLATFORM_NAMESPACES.evidence}
        faqItems={[
          { qKey: 'faq1Q', aKey: 'faq1A' },
          { qKey: 'faq2Q', aKey: 'faq2A' },
          { qKey: 'faq3Q', aKey: 'faq3A' },
        ]}
      >
        <p className="mt-4 text-sm text-gray-500">
          {lpShared('windowNote', lang)} · {lpShared('generatedAt', lang)}{' '}
          {new Date(snapshot.generatedAt).toLocaleString(lang === 'en' ? 'en-GB' : 'nl-NL')}
        </p>
        <EvidenceDashboard snapshot={snapshot} lang={lang} emptyLabel={emptyLabel} />
      </LivingPlatformPageShell>
    </>
  );
}
