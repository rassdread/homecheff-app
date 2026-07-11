import { cookies, headers } from 'next/headers';
import LivingPlatformJsonLd from '@/components/living-platform/LivingPlatformJsonLd';
import LivingPlatformPageShell from '@/components/living-platform/LivingPlatformPageShell';
import StatisticsTable from '@/components/living-platform/StatisticsTable';
import { buildLivingPlatformMetadata } from '@/lib/living-platform/build-living-platform-metadata';
import { getPlatformStatistics } from '@/lib/living-platform/evidence-queries';
import {
  LIVING_PLATFORM_NAMESPACES,
  LIVING_PLATFORM_PATHS,
} from '@/lib/living-platform/registry';
import { lpMeta, lpShared, resolveLivingPlatformLang } from '@/lib/living-platform/server-i18n';

export const revalidate = 300;

export async function generateMetadata() {
  return buildLivingPlatformMetadata(
    LIVING_PLATFORM_PATHS.statistics,
    LIVING_PLATFORM_NAMESPACES.statistics,
  );
}

export default async function StatisticsPage() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const lang = resolveLivingPlatformLang(
    headersList.get('X-HomeCheff-Language'),
    cookieStore.get('homecheff-language')?.value,
  );

  const stats = await getPlatformStatistics();
  const meta = lpMeta(LIVING_PLATFORM_NAMESPACES.statistics, lang);

  return (
    <>
      <LivingPlatformJsonLd
        kind="dataset"
        path={LIVING_PLATFORM_PATHS.statistics}
        name={meta.title}
        description={meta.description}
      />
      <LivingPlatformPageShell
        ns={LIVING_PLATFORM_NAMESPACES.statistics}
        faqItems={[
          { qKey: 'faq1Q', aKey: 'faq1A' },
          { qKey: 'faq2Q', aKey: 'faq2A' },
          { qKey: 'faq3Q', aKey: 'faq3A' },
        ]}
      >
        <p className="mt-4 text-sm text-gray-500">
          {lpShared('generatedAt', lang)}{' '}
          {new Date(stats.generatedAt).toLocaleString(lang === 'en' ? 'en-GB' : 'nl-NL')}
        </p>
        <StatisticsTable stats={stats} lang={lang} />
      </LivingPlatformPageShell>
    </>
  );
}
