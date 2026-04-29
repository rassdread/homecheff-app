import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';

/**
 * Server component: laad eerste batch inspiratie server-side zodat de feed direct zichtbaar is (geen lege omheining).
 */
export default async function HomePage() {
  const { items } = await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' });
  return <HomePageClient initialInspiratieItems={items} />;
}
