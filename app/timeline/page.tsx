import LivingPlatformJsonLd from '@/components/living-platform/LivingPlatformJsonLd';
import LivingPlatformPageShell from '@/components/living-platform/LivingPlatformPageShell';
import TimelinePageContent from '@/components/living-platform/TimelinePageContent';
import { buildLivingPlatformMetadata } from '@/lib/living-platform/build-living-platform-metadata';
import {
  LIVING_PLATFORM_NAMESPACES,
  LIVING_PLATFORM_PATHS,
} from '@/lib/living-platform/registry';
import { lpMeta } from '@/lib/living-platform/server-i18n';

export async function generateMetadata() {
  return buildLivingPlatformMetadata(
    LIVING_PLATFORM_PATHS.timeline,
    LIVING_PLATFORM_NAMESPACES.timeline,
  );
}

export default function TimelinePage() {
  const meta = lpMeta(LIVING_PLATFORM_NAMESPACES.timeline, 'nl');

  return (
    <>
      <LivingPlatformJsonLd
        kind="techArticle"
        path={LIVING_PLATFORM_PATHS.timeline}
        name={meta.title}
        description={meta.description}
      />
      <LivingPlatformPageShell
        ns={LIVING_PLATFORM_NAMESPACES.timeline}
        faqItems={[
          { qKey: 'faq1Q', aKey: 'faq1A' },
          { qKey: 'faq2Q', aKey: 'faq2A' },
          { qKey: 'faq3Q', aKey: 'faq3A' },
        ]}
      >
        <TimelinePageContent />
      </LivingPlatformPageShell>
    </>
  );
}
