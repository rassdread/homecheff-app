import { getInspiratieItems } from '@/lib/getInspiratieItems';
import HomePageClient from '@/components/home/HomePageClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { InitialHomeUiFromServer } from '@/lib/homeUiPreferences';

function parseFeedChipFromSearch(
  raw: string | string[] | undefined
): 'all' | 'sale' | 'inspiration' | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return undefined;
  if (v === 'inspiration' || v === 'inspiratie') return 'inspiration';
  if (v === 'sale' || v === 'products' || v === 'producten') return 'sale';
  if (v === 'all') return 'all';
  return undefined;
}

/**
 * Server component: laad eerste batch inspiratie server-side zodat de feed direct zichtbaar is (geen lege omheining).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { items } = await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' });
  const initialFeedChip = parseFeedChipFromSearch(searchParams?.feed);

  let initialHomeUiFromServer: InitialHomeUiFromServer = null;
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    if (userId) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { hideHomeHero: true, hideHowItWorks: true },
      });
      if (u) {
        initialHomeUiFromServer = {
          hideHomeHero: u.hideHomeHero,
          hideHowItWorks: u.hideHowItWorks,
        };
      }
    }
  } catch {
    initialHomeUiFromServer = null;
  }

  return (
    <HomePageClient
      initialInspiratieItems={items}
      initialHomeUiFromServer={initialHomeUiFromServer}
      initialFeedChip={initialFeedChip}
    />
  );
}
