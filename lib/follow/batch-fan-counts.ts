import { prisma } from '@/lib/prisma';

/** Canonical fan counts: prisma.follow.count grouped by sellerId (User.id). */
export async function countFansBySellerIds(
  sellerIds: string[],
): Promise<Map<string, number>> {
  const ids = [...new Set(sellerIds.filter(Boolean))];
  const out = new Map<string, number>();
  if (ids.length === 0) return out;

  const rows = await prisma.follow.groupBy({
    by: ['sellerId'],
    where: { sellerId: { in: ids } },
    _count: { _all: true },
  });

  for (const row of rows) {
    out.set(row.sellerId, row._count._all);
  }
  return out;
}
