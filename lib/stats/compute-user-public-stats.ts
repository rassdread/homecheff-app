/**
 * Shared public user stats — feed preview, UserStatsTile, /api/user/[id]/stats.
 * Trust Stabilization Phase 0: favorites ≠ props; product reviews only for rating.
 */
import { prisma } from '@/lib/prisma';

export type UserPublicStats = {
  fansCount: number;
  followingCount: number;
  /** Saves on products + inspiration dishes (Favorite table). */
  totalFavorites: number;
  /** WorkspaceContentProp on seller studio content — not listing favorites. */
  totalWorkspaceProps: number;
  /** ProductReview count on seller products (trust). */
  productReviewCount: number;
  productAverageRating: number;
  /** DishReview count — community feedback, not trust. */
  communityFeedbackCount: number;
  totalViews: number;
};

export const EMPTY_USER_PUBLIC_STATS: UserPublicStats = {
  fansCount: 0,
  followingCount: 0,
  totalFavorites: 0,
  totalWorkspaceProps: 0,
  productReviewCount: 0,
  productAverageRating: 0,
  communityFeedbackCount: 0,
  totalViews: 0,
};

/** Legacy tile payload — maps to UserPublicStats field names used by clients. */
export type UserStatsTilePayload = {
  fansCount: number;
  followingCount: number;
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  /** Workspace props only (Phase 0 semantics). */
  totalProps: number;
  communityFeedbackCount: number;
};

export function toUserStatsTilePayload(stats: UserPublicStats): UserStatsTilePayload {
  return {
    fansCount: stats.fansCount,
    followingCount: stats.followingCount,
    totalFavorites: stats.totalFavorites,
    totalReviews: stats.productReviewCount,
    averageRating: stats.productAverageRating,
    totalViews: stats.totalViews,
    totalProps: stats.totalWorkspaceProps,
    communityFeedbackCount: stats.communityFeedbackCount,
  };
}

export async function computeUserPublicStats(userId: string): Promise<UserPublicStats> {
  const sellerProducts = await prisma.product.findMany({
    where: {
      seller: { userId },
      isActive: true,
    },
    select: { id: true },
  });

  const userDishes = await prisma.dish.findMany({
    where: { userId, status: 'PUBLISHED' },
    select: { id: true },
  });

  const productIds = sellerProducts.map((p) => p.id);
  const dishIds = userDishes.map((d) => d.id);
  const allItemIds = [...productIds, ...dishIds];

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  const [fansCount, followingCount, totalFavorites, totalWorkspaceProps, productReviews, communityFeedbackCount, totalViews] =
    await Promise.all([
    prisma.follow.count({ where: { sellerId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    productIds.length > 0 || dishIds.length > 0
      ? prisma.favorite.count({
          where: {
            OR: [
              ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
              ...(dishIds.length > 0 ? [{ dishId: { in: dishIds } }] : []),
            ],
          },
        })
      : Promise.resolve(0),
    sellerProfile
      ? prisma.workspaceContentProp.count({
          where: {
            workspaceContent: { sellerProfileId: sellerProfile.id },
          },
        })
      : Promise.resolve(0),
    productIds.length > 0
      ? prisma.productReview.findMany({
          where: { productId: { in: productIds } },
          select: { rating: true },
        })
      : Promise.resolve([]),
    dishIds.length > 0
      ? prisma.dishReview.count({ where: { dishId: { in: dishIds } } })
      : Promise.resolve(0),
    allItemIds.length > 0
      ? prisma.analyticsEvent.count({
          where: {
            entityId: { in: allItemIds },
            eventType: { in: ['VIEW', 'PRODUCT_VIEW'] },
            entityType: { in: ['PRODUCT', 'DISH'] },
          },
        })
      : Promise.resolve(0),
  ]);

  const productReviewCount = productReviews.length;
  const productAverageRating =
    productReviewCount > 0
      ? Math.round(
          (productReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            productReviewCount) *
            10,
        ) / 10
      : 0;

  return {
    fansCount,
    followingCount,
    totalFavorites,
    totalWorkspaceProps,
    productReviewCount,
    productAverageRating,
    communityFeedbackCount,
    totalViews,
  };
}
