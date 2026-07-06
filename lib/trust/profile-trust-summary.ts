import { prisma } from '@/lib/prisma';

export type TrustChannelSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export type ProfileTrustSummary = {
  product: TrustChannelSummary;
  deal: TrustChannelSummary;
  courier: TrustChannelSummary;
  totals: {
    completedDeals: number;
    completedDeliveries: number;
    repeatCustomers: number;
  };
  topSpecializations: string[];
  memberSince: string;
};

function roundRating(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function channelFromAggregate(agg: {
  _avg: { rating: number | null };
  _count: { id: number };
}): TrustChannelSummary {
  const reviewCount = agg._count.id;
  const averageRating =
    reviewCount > 0 && agg._avg.rating != null
      ? roundRating(agg._avg.rating)
      : null;
  return { averageRating, reviewCount };
}

const EMPTY_CHANNEL: TrustChannelSummary = {
  averageRating: null,
  reviewCount: 0,
};

/**
 * Per-channel trust metrics — no composite headline average (Phase 0).
 */
export async function getProfileTrustSummary(
  userId: string,
): Promise<ProfileTrustSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, SellerProfile: { select: { id: true } } },
  });

  if (!user) {
    return {
      product: { ...EMPTY_CHANNEL },
      deal: { ...EMPTY_CHANNEL },
      courier: { ...EMPTY_CHANNEL },
      totals: {
        completedDeals: 0,
        completedDeliveries: 0,
        repeatCustomers: 0,
      },
      topSpecializations: [],
      memberSince: new Date().toISOString(),
    };
  }

  const sellerId = user.SellerProfile?.id;

  const [
    dealReviewsReceived,
    productReviews,
    deliveryReviews,
    completedDealsAsSeller,
    completedDealsAsBuyer,
    completedDeliveries,
    repeatAsSeller,
    repeatAsBuyer,
    topSpecs,
  ] = await Promise.all([
    prisma.dealReview.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { id: true },
    }),
    sellerId
      ? prisma.productReview.aggregate({
          where: {
            product: { sellerId },
            reviewSubmittedAt: { not: null },
            rating: { gt: 0 },
          },
          _avg: { rating: true },
          _count: { id: true },
        })
      : Promise.resolve({ _avg: { rating: null }, _count: { id: 0 } }),
    prisma.deliveryProfile
      .findUnique({
        where: { userId },
        select: { id: true },
      })
      .then((profile) =>
        profile
          ? prisma.deliveryReview.aggregate({
              where: { deliveryProfileId: profile.id },
              _avg: { rating: true },
              _count: { id: true },
            })
          : { _avg: { rating: null }, _count: { id: 0 } },
      ),
    prisma.communityOrder.count({
      where: { sellerId: userId, status: 'COMPLETED' },
    }),
    prisma.communityOrder.count({
      where: { buyerId: userId, status: 'COMPLETED' },
    }),
    prisma.courierAssignment.count({
      where: { courierId: userId, status: 'COMPLETED' },
    }),
    prisma.communityOrder.groupBy({
      by: ['buyerId'],
      where: { sellerId: userId, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.communityOrder.groupBy({
      by: ['sellerId'],
      where: { buyerId: userId, status: 'COMPLETED' },
      _count: { id: true },
    }),
    sellerId
      ? prisma.product.findMany({
          where: { sellerId, isActive: true },
          select: { specializations: true },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const specCounts = new Map<string, number>();
  for (const product of topSpecs) {
    for (const spec of product.specializations ?? []) {
      specCounts.set(spec, (specCounts.get(spec) ?? 0) + 1);
    }
  }
  const topSpecializations = [...specCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const completedDeals = completedDealsAsSeller + completedDealsAsBuyer;
  const repeatCustomers =
    repeatAsSeller.filter((g) => g._count.id >= 2).length +
    repeatAsBuyer.filter((g) => g._count.id >= 2).length;

  return {
    product: channelFromAggregate(productReviews),
    deal: channelFromAggregate(dealReviewsReceived),
    courier: channelFromAggregate(deliveryReviews),
    totals: {
      completedDeals,
      completedDeliveries,
      repeatCustomers,
    },
    topSpecializations,
    memberSince: user.createdAt.toISOString(),
  };
}
