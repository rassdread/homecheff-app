import { prisma } from '@/lib/prisma';
import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

/**
 * After a paid order is created: if this seller had no prior paid orders, award FIRST_SALE once (idempotent on seller).
 */
export async function tryAwardFirstSaleForSeller(
  sellerUserId: string,
  newOrderId: string,
): Promise<void> {
  const priorPaid = await prisma.order.count({
    where: {
      id: { not: newOrderId },
      status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      items: {
        some: {
          Product: {
            seller: { userId: sellerUserId },
          },
        },
      },
    },
  });

  if (priorPaid > 0) return;

  await awardHcp({
    userId: sellerUserId,
    action: 'FIRST_SALE',
    points: HCP_ACTION_POINTS.FIRST_SALE,
    sourceType: 'SELLER',
    sourceId: sellerUserId,
  });
}
