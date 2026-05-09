import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

/**
 * After a product exists with a known image count, award product + photo milestone HCP (idempotent).
 */
export async function awardProductLifecycleHcp(
  sellerUserId: string,
  productId: string,
  imageCount: number,
): Promise<void> {
  await awardHcp({
    userId: sellerUserId,
    action: 'PRODUCT_CREATED',
    points: HCP_ACTION_POINTS.PRODUCT_CREATED,
    sourceType: 'PRODUCT',
    sourceId: productId,
  });

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
