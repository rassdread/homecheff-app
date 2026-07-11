import LivingPlatformJsonLd from '@/components/living-platform/LivingPlatformJsonLd';
import LivingPlatformPageShell from '@/components/living-platform/LivingPlatformPageShell';
import HowHomeCheffGrowsContent from '@/components/living-platform/HowHomeCheffGrowsContent';
import { buildLivingPlatformMetadata } from '@/lib/living-platform/build-living-platform-metadata';
import {
  LIVING_PLATFORM_NAMESPACES,
  LIVING_PLATFORM_PATHS,
} from '@/lib/living-platform/registry';
import { lpMeta } from '@/lib/living-platform/server-i18n';

export async function generateMetadata() {
  return buildLivingPlatformMetadata(
    LIVING_PLATFORM_PATHS.howHomeCheffGrows,
    LIVING_PLATFORM_NAMESPACES.howHomeCheffGrows,
  );
}

export default function HowHomeCheffGrowsPage() {
  const meta = lpMeta(LIVING_PLATFORM_NAMESPACES.howHomeCheffGrows, 'nl');

  return (
    <>
      <LivingPlatformJsonLd
        kind="techArticle"
        path={LIVING_PLATFORM_PATHS.howHomeCheffGrows}
        name={meta.title}
        description={meta.description}
      />
      <LivingPlatformPageShell
        ns={LIVING_PLATFORM_NAMESPACES.howHomeCheffGrows}
        faqItems={[
          { qKey: 'faq1Q', aKey: 'faq1A' },
          { qKey: 'faq2Q', aKey: 'faq2A' },
          { qKey: 'faq3Q', aKey: 'faq3A' },
        ]}
      >
        <HowHomeCheffGrowsContent />
      </LivingPlatformPageShell>
    </>
  );
}
