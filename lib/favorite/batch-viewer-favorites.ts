import { prisma } from '@/lib/prisma';

/** Viewer Favorite rows for a page of product/dish ids — one query, not per tile. */
export async function findViewerFavoritedItemIds(
  userId: string | null | undefined,
  itemIds: string[],
): Promise<Set<string>> {
  const ids = [...new Set(itemIds.filter(Boolean))];
  const out = new Set<string>();
  if (!userId || ids.length === 0) return out;

  const rows = await prisma.favorite.findMany({
    where: {
      userId,
      OR: [{ productId: { in: ids } }, { dishId: { in: ids } }],
    },
    select: { productId: true, dishId: true },
  });

  for (const row of rows) {
    if (row.productId) out.add(row.productId);
    if (row.dishId) out.add(row.dishId);
  }
  return out;
}
