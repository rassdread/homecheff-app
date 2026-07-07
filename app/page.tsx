import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';

type HomeFeedChip = 'all' | 'sale' | 'inspiration' | 'gezocht';
export const revalidate = 60;

function normalizeHomeFeedChip(raw: string | undefined): HomeFeedChip | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (v === 'sale' || v === 'shop' || v === 'koop' || v === 'dorpsplein') return 'sale';
  if (v === 'all' || v === 'mixed' || v === 'everything') return 'all';
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
    v === 'help' ||
    v === 'hulp'
  ) {
    return 'gezocht';
  }
  return undefined;
}

function normalizeHomeFeedVertical(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (v === 'cheff' || v === 'chef' || v === 'keuken') return 'cheff';
  if (v === 'grown' || v === 'garden' || v === 'tuin') return 'garden';
  if (v === 'designer' || v === 'design' || v === 'studio') return 'designer';
  if (v === 'all') return 'all';
  return undefined;
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
  const initialFeedChip = normalizeHomeFeedChip(raw);
  const initialFeedCategory = normalizeHomeFeedVertical(searchParams?.vertical);
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
