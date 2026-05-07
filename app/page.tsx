import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';

type HomeFeedChip = 'all' | 'sale' | 'inspiration';
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
  return undefined;
}

/**
 * Server component: eerste batch inspiratie + optionele feed-chip (/?chip=sale|inspiration|all#homecheff-feed).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: { chip?: string };
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

  return (
    <HomePageClient
      initialInspiratieItems={items}
      initialFeedChip={initialFeedChip}
    />
  );
}
