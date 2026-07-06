/**
 * Batch-fetch seller trust snapshots — avoids N+1 per listing.
 * Fixed query count regardless of listing batch size (Phase 2B-H).
 */

import { prisma } from '@/lib/prisma';
import { filterTrustBadgeSlugs } from './trust-badge-utils';
import { emptySellerTrustSnapshot, type SellerTrustSnapshot } from './types';

const DELIVERED_ORDER_STATUSES = ['DELIVERED', 'SHIPPED', 'CONFIRMED'] as const;

/**
 * Fetch trust evidence for many seller user IDs in O(1) query rounds (not O(n)).
 */
export async function fetchSellerTrustSnapshots(
  userIds: string[],
): Promise<Map<string, SellerTrustSnapshot>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, SellerTrustSnapshot>();
  if (unique.length === 0) return out;

  for (const uid of unique) {
    out.set(uid, emptySellerTrustSnapshot(uid));
  }

  const [
    sellerProfiles,
    deliveryProfiles,
    activeListingCounts,
    dealReviewAggs,
    productReviewBySeller,
    deliveryReviewAggs,
    completedAsSeller,
    completedAsBuyer,
    completedDeliveries,
    productOrderCounts,
    dealPairsAsSeller,
    dealPairsAsBuyer,
    reviewsLeftProduct,
    reviewsLeftDeal,
    reviewsLeftDelivery,
    userBadges,
  ] = await Promise.all([
    prisma.sellerProfile.findMany({
      where: { userId: { in: unique } },
      select: { id: true, userId: true },
    }),
    prisma.deliveryProfile.findMany({
      where: { userId: { in: unique } },
      select: { id: true, userId: true },
    }),
    prisma.product.groupBy({
      by: ['sellerId'],
      where: { isActive: true, seller: { User: { id: { in: unique } } } },
      _count: { id: true },
    }),
    prisma.dealReview.groupBy({
      by: ['revieweeId'],
      where: { revieweeId: { in: unique } },
      _count: { id: true },
    }),
    prisma.productReview.groupBy({
      by: ['productId'],
      where: {
        reviewSubmittedAt: { not: null },
        rating: { gt: 0 },
        product: { seller: { User: { id: { in: unique } } } },
      },
      _count: { id: true },
    }),
    prisma.deliveryReview.groupBy({
      by: ['deliveryProfileId'],
      where: {
        deliveryProfile: { userId: { in: unique } },
      },
      _count: { id: true },
    }),
    prisma.communityOrder.groupBy({
      by: ['sellerId'],
      where: { sellerId: { in: unique }, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.communityOrder.groupBy({
      by: ['buyerId'],
      where: { buyerId: { in: unique }, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.courierAssignment.groupBy({
      by: ['courierId'],
      where: { courierId: { in: unique }, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        Order: { status: { in: [...DELIVERED_ORDER_STATUSES] } },
        Product: { seller: { User: { id: { in: unique } } } },
      },
      _count: { id: true },
    }),
    prisma.communityOrder.groupBy({
      by: ['sellerId', 'buyerId'],
      where: { sellerId: { in: unique }, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.communityOrder.groupBy({
      by: ['buyerId', 'sellerId'],
      where: { buyerId: { in: unique }, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.productReview.groupBy({
      by: ['buyerId'],
      where: { buyerId: { in: unique }, reviewSubmittedAt: { not: null } },
      _count: { id: true },
    }),
    prisma.dealReview.groupBy({
      by: ['reviewerId'],
      where: { reviewerId: { in: unique } },
      _count: { id: true },
    }),
    prisma.deliveryReview.groupBy({
      by: ['reviewerId'],
      where: { reviewerId: { in: unique } },
      _count: { id: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: { in: unique } },
      include: { badge: { select: { slug: true } } },
    }),
  ]);

  const sellerIdToUserId = new Map<string, string>();
  for (const sp of sellerProfiles) {
    sellerIdToUserId.set(sp.id, sp.userId);
    const row = out.get(sp.userId)!;
    row.hasSellerProfile = true;
  }

  const deliveryProfileToUser = new Map<string, string>();
  for (const dp of deliveryProfiles) {
    deliveryProfileToUser.set(dp.id, dp.userId);
    const row = out.get(dp.userId)!;
    row.hasDeliveryProfile = true;
  }

  for (const g of activeListingCounts) {
    const uid = sellerIdToUserId.get(g.sellerId);
    if (uid && g._count.id > 0) {
      out.get(uid)!.hasActiveListing = true;
    }
  }

  for (const g of dealReviewAggs) {
    const row = out.get(g.revieweeId);
    if (row) row.dealReviewCount = g._count.id;
  }

  if (productReviewBySeller.length > 0) {
    const productIds = productReviewBySeller.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sellerId: true },
    });
    const productSeller = new Map(products.map((p) => [p.id, p.sellerId]));
    const sellerReviewTotals = new Map<string, number>();
    for (const g of productReviewBySeller) {
      const sid = productSeller.get(g.productId);
      if (!sid) continue;
      sellerReviewTotals.set(
        sid,
        (sellerReviewTotals.get(sid) ?? 0) + g._count.id,
      );
    }
    for (const [sellerId, count] of sellerReviewTotals) {
      const uid = sellerIdToUserId.get(sellerId);
      if (uid) out.get(uid)!.productReviewCountSeller = count;
    }
  }

  for (const g of deliveryReviewAggs) {
    const uid = deliveryProfileToUser.get(g.deliveryProfileId);
    if (uid) out.get(uid)!.courierReviewCount = g._count.id;
  }

  for (const g of completedAsSeller) {
    const row = out.get(g.sellerId);
    if (row) row.completedDealsAsSeller = g._count.id;
  }

  for (const g of completedAsBuyer) {
    const row = out.get(g.buyerId);
    if (row) row.completedDealsAsBuyer = g._count.id;
  }

  for (const g of completedDeliveries) {
    const row = out.get(g.courierId);
    if (row) row.completedDeliveries = g._count.id;
  }

  if (productOrderCounts.length > 0) {
    const pids = productOrderCounts.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: pids } },
      select: { id: true, sellerId: true },
    });
    const productSeller = new Map(products.map((p) => [p.id, p.sellerId]));
    const orderTotals = new Map<string, number>();
    for (const g of productOrderCounts) {
      const sid = productSeller.get(g.productId);
      if (!sid) continue;
      orderTotals.set(sid, (orderTotals.get(sid) ?? 0) + g._count.id);
    }
    for (const [sellerId, count] of orderTotals) {
      const uid = sellerIdToUserId.get(sellerId);
      if (uid) out.get(uid)!.completedProductOrders = count;
    }
  }

  for (const g of dealPairsAsSeller) {
    if (g._count.id < 2) continue;
    const row = out.get(g.sellerId);
    if (row) row.repeatCustomers += 1;
  }
  for (const g of dealPairsAsBuyer) {
    if (g._count.id < 2) continue;
    const row = out.get(g.buyerId);
    if (row) row.repeatCustomers += 1;
  }

  const reviewsLeft = new Map<string, number>();
  for (const g of reviewsLeftProduct) {
    reviewsLeft.set(g.buyerId, (reviewsLeft.get(g.buyerId) ?? 0) + g._count.id);
  }
  for (const g of reviewsLeftDeal) {
    reviewsLeft.set(
      g.reviewerId,
      (reviewsLeft.get(g.reviewerId) ?? 0) + g._count.id,
    );
  }
  for (const g of reviewsLeftDelivery) {
    reviewsLeft.set(
      g.reviewerId,
      (reviewsLeft.get(g.reviewerId) ?? 0) + g._count.id,
    );
  }
  for (const [uid, count] of reviewsLeft) {
    const row = out.get(uid);
    if (row) row.reviewsLeftCount = count;
  }

  const badgesByUser = new Map<string, string[]>();
  for (const ub of userBadges) {
    const list = badgesByUser.get(ub.userId) ?? [];
    list.push(ub.badge.slug);
    badgesByUser.set(ub.userId, list);
  }
  for (const [uid, slugs] of badgesByUser) {
    const row = out.get(uid);
    if (row) row.trustBadgeSlugs = filterTrustBadgeSlugs(slugs);
  }

  return out;
}
