import { prisma } from '@/lib/prisma';
import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

/**
 * After a product exists with a known image count, award first-listing bonus of volgende listing + foto-milestones (idempotent).
 */
export async function awardProductLifecycleHcp(
  sellerUserId: string,
  productId: string,
  imageCount: number,
): Promise<void> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: sellerUserId },
    select: { id: true },
  });
  if (!seller) return;

  const activeCount = await prisma.product.count({
    where: { sellerId: seller.id, isActive: true },
  });
  const isFirstActiveListing = activeCount === 1;

  if (isFirstActiveListing) {
    await awardHcp({
      userId: sellerUserId,
      action: 'FIRST_ITEM_PLACED',
      points: HCP_ACTION_POINTS.FIRST_ITEM_PLACED,
      sourceType: 'USER',
      sourceId: sellerUserId,
    });
  } else {
    await awardHcp({
      userId: sellerUserId,
      action: 'PRODUCT_CREATED',
      points: HCP_ACTION_POINTS.PRODUCT_CREATED,
      sourceType: 'PRODUCT',
      sourceId: productId,
    });
  }

  if (imageCount >= 3) {
    await awardHcp({
      userId: sellerUserId,
      action: 'PRODUCT_HAS_3_PHOTOS',
      points: HCP_ACTION_POINTS.PRODUCT_HAS_3_PHOTOS,
      sourceType: 'PRODUCT',
      sourceId: productId,
    });
  }
  if (imageCount >= 5) {
    await awardHcp({
      userId: sellerUserId,
      action: 'PRODUCT_HAS_5_PHOTOS',
      points: HCP_ACTION_POINTS.PRODUCT_HAS_5_PHOTOS,
      sourceType: 'PRODUCT',
      sourceId: productId,
    });
  }
}
