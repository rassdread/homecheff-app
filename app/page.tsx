import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';

type HomeFeedChip = 'all' | 'sale' | 'inspiration';

/**
 * Server component: eerste batch inspiratie + optionele feed-chip (/?chip=sale|inspiration|all#homecheff-feed).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: { chip?: string };
}) {
  const { items } = await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' });
  const raw = searchParams?.chip;
  const initialFeedChip: HomeFeedChip | undefined =
    raw === 'sale' || raw === 'inspiration' || raw === 'all' ? raw : undefined;
  return (
    <HomePageClient
      initialInspiratieItems={items}
      initialFeedChip={initialFeedChip}
    />
  );
}
