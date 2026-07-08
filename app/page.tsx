import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';
import {
  isLegacyServicesViewChip,
  migrateLegacyServicesViewChip,
  normalizeDiscoveryCategorySlug,
} from '@/lib/marketplace/canonical-model';
import type { FeedViewFilterId } from '@/lib/feed/feed-taxonomy';

export const revalidate = 60;

function normalizeHomeFeedChip(raw: string | undefined): FeedViewFilterId | undefined {
  if (!raw) return undefined;
  if (isLegacyServicesViewChip(raw)) return undefined;
  const v = raw.toLowerCase().trim();
  if (v === 'sale' || v === 'shop' || v === 'koop' || v === 'dorpsplein' || v === 'offered' || v === 'aanbod' || v === 'aangeboden') {
    return 'sale';
  }
  if (v === 'all' || v === 'mixed' || v === 'everything' || v === 'alles') return 'all';
  if (
    v === 'inspiration' ||
    v === 'inspiratie' ||
    v === 'ideas' ||
    v === 'inspire'
  ) {
    return 'inspiration';
  }
  if (
    v === 'gezocht' ||
    v === 'request' ||
    v === 'requests' ||
    v === 'wanted'
  ) {
    return 'gezocht';
  }
  return undefined;
}

function normalizeHomeFeedVertical(raw: string | undefined): string | undefined {
  const slug = normalizeDiscoveryCategorySlug(raw);
  return slug === 'all' ? undefined : slug;
}

function resolveHomeFeedDeepLink(
  chipRaw: string | undefined,
  verticalRaw: string | undefined,
): { initialFeedChip?: FeedViewFilterId; initialFeedCategory?: string } {
  const legacy = migrateLegacyServicesViewChip(chipRaw, verticalRaw);
  if (legacy) {
    return { initialFeedChip: legacy.chip, initialFeedCategory: legacy.category };
  }
  const initialFeedChip = normalizeHomeFeedChip(chipRaw);
  const initialFeedCategory = normalizeHomeFeedVertical(verticalRaw);
  return { initialFeedChip, initialFeedCategory };
}

/**
 * Server component: eerste batch inspiratie + optionele feed-chip (/?chip=sale|inspiration|all#homecheff-feed).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: { chip?: string; vertical?: string; place?: string; stickyTest?: string };
}) {
  let items: Awaited<ReturnType<typeof getInspiratieItems>>['items'] = [];
  try {
    const res = await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' });
    items = res.items;
  } catch (e) {
    console.error('[HomePage] getInspiratieItems failed:', e);
  }

  const raw = searchParams?.chip;
  const { initialFeedChip, initialFeedCategory } = resolveHomeFeedDeepLink(
    raw,
    searchParams?.vertical,
  );
  const initialFeedPlace = searchParams?.place?.trim().slice(0, 200) || undefined;
  const stickyTestMode = searchParams?.stickyTest != null && searchParams.stickyTest !== '0';

  return (
    <HomePageClient
      initialInspiratieItems={items}
      initialFeedChip={initialFeedChip}
      initialFeedCategory={initialFeedCategory}
      initialFeedPlace={initialFeedPlace}
      stickyTestMode={stickyTestMode}
    />
  );
}
