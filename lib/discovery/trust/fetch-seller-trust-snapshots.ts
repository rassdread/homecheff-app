/**
 * Batch-fetch seller trust snapshots — avoids N+1 per listing.
 * Fixed query count regardless of listing batch size (Phase 2B-H).
 *
 * groupBy queries use direct id filters (no nested relation joins) to avoid
 * Postgres "column reference id is ambiguous" errors.
 */

import { prisma } from '@/lib/prisma';
import { filterTrustBadgeSlugs } from './trust-badge-utils';
import { emptySellerTrustSnapshot, type SellerTrustSnapshot } from './types';

const DELIVERED_ORDER_STATUSES = ['DELIVERED', 'SHIPPED', 'CONFIRMED'] as const;

type GroupCountRow = { _count: { _all: number } };

function readGroupCount(row: GroupCountRow): number {
  return row._count._all ?? 0;
}

async function countDeliveredOrderItemsByProductId(
  productIds: string[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
      Order: { status: { in: [...DELIVERED_ORDER_STATUSES] } },
    },
    select: { productId: true },
  });
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.productId, (totals.get(row.productId) ?? 0) + 1);
  }
  return totals;
}

/**
 * Fetch trust evidence for many seller user IDs in O(1) query rounds (not O(n)).
 * On failure returns empty snapshots per user — never throws.
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

  try {
    const [sellerProfiles, deliveryProfiles] = await Promise.all([
      prisma.sellerProfile.findMany({
        where: { userId: { in: unique } },
        select: { id: true, userId: true },
      }),
      prisma.deliveryProfile.findMany({
        where: { userId: { in: unique } },
        select: { id: true, userId: true },
      }),
    ]);

    const sellerProfileIds = sellerProfiles.map((sp) => sp.id);
    const deliveryProfileIds = deliveryProfiles.map((dp) => dp.id);

    const sellerProducts =
      sellerProfileIds.length > 0
        ? await prisma.product.findMany({
            where: { sellerId: { in: sellerProfileIds } },
            select: { id: true, sellerId: true },
          })
        : [];
    const productIds = sellerProducts.map((p) => p.id);
    const productSeller = new Map(sellerProducts.map((p) => [p.id, p.sellerId]));

    const [
      activeListingCounts,
      dealReviewAggs,
      productReviewByProduct,
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
      sellerProfileIds.length > 0
        ? prisma.product.groupBy({
            by: ['sellerId'],
            where: { isActive: true, sellerId: { in: sellerProfileIds } },
            _count: { _all: true },
          })
        : Promise.resolve([] as GroupCountRow[]),
      prisma.dealReview.groupBy({
        by: ['revieweeId'],
        where: { revieweeId: { in: unique } },
        _count: { _all: true },
      }),
      productIds.length > 0
        ? prisma.productReview.groupBy({
            by: ['productId'],
            where: {
              productId: { in: productIds },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 },
            },
            _count: { _all: true },
          })
        : Promise.resolve([] as GroupCountRow[]),
      deliveryProfileIds.length > 0
        ? prisma.deliveryReview.groupBy({
            by: ['deliveryProfileId'],
            where: { deliveryProfileId: { in: deliveryProfileIds } },
            _count: { _all: true },
          })
        : Promise.resolve([] as GroupCountRow[]),
      prisma.communityOrder.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      prisma.communityOrder.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      prisma.courierAssignment.groupBy({
        by: ['courierId'],
        where: { courierId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      countDeliveredOrderItemsByProductId(productIds),
      prisma.communityOrder.groupBy({
        by: ['sellerId', 'buyerId'],
        where: { sellerId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      prisma.communityOrder.groupBy({
        by: ['buyerId', 'sellerId'],
        where: { buyerId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      prisma.productReview.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: unique }, reviewSubmittedAt: { not: null } },
        _count: { _all: true },
      }),
      prisma.dealReview.groupBy({
        by: ['reviewerId'],
        where: { reviewerId: { in: unique } },
        _count: { _all: true },
      }),
      prisma.deliveryReview.groupBy({
        by: ['reviewerId'],
        where: { reviewerId: { in: unique } },
        _count: { _all: true },
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
      const sellerId = (g as { sellerId: string }).sellerId;
      const uid = sellerIdToUserId.get(sellerId);
      if (uid && readGroupCount(g as GroupCountRow) > 0) {
        out.get(uid)!.hasActiveListing = true;
      }
    }

    for (const g of dealReviewAggs) {
      const row = out.get((g as { revieweeId: string }).revieweeId);
      if (row) row.dealReviewCount = readGroupCount(g as GroupCountRow);
    }

    const sellerReviewTotals = new Map<string, number>();
    for (const g of productReviewByProduct) {
      const productId = (g as { productId: string }).productId;
      const sid = productSeller.get(productId);
      if (!sid) continue;
      sellerReviewTotals.set(
        sid,
        (sellerReviewTotals.get(sid) ?? 0) + readGroupCount(g as GroupCountRow),
      );
    }
    for (const [sellerId, count] of sellerReviewTotals) {
      const uid = sellerIdToUserId.get(sellerId);
      if (uid) out.get(uid)!.productReviewCountSeller = count;
    }

    for (const g of deliveryReviewAggs) {
      const uid = deliveryProfileToUser.get(
        (g as { deliveryProfileId: string }).deliveryProfileId,
      );
      if (uid) out.get(uid)!.courierReviewCount = readGroupCount(g as GroupCountRow);
    }

    for (const g of completedAsSeller) {
      const row = out.get((g as { sellerId: string }).sellerId);
      if (row) row.completedDealsAsSeller = readGroupCount(g as GroupCountRow);
    }

    for (const g of completedAsBuyer) {
      const row = out.get((g as { buyerId: string }).buyerId);
      if (row) row.completedDealsAsBuyer = readGroupCount(g as GroupCountRow);
    }

    for (const g of completedDeliveries) {
      const row = out.get((g as { courierId: string }).courierId);
      if (row) row.completedDeliveries = readGroupCount(g as GroupCountRow);
    }

    const orderTotals = new Map<string, number>();
    for (const [productId, count] of productOrderCounts) {
      const sid = productSeller.get(productId);
      if (!sid) continue;
      orderTotals.set(sid, (orderTotals.get(sid) ?? 0) + count);
    }
    for (const [sellerId, count] of orderTotals) {
      const uid = sellerIdToUserId.get(sellerId);
      if (uid) out.get(uid)!.completedProductOrders = count;
    }

    for (const g of dealPairsAsSeller) {
      if (readGroupCount(g as GroupCountRow) < 2) continue;
      const row = out.get((g as { sellerId: string }).sellerId);
      if (row) row.repeatCustomers += 1;
    }
    for (const g of dealPairsAsBuyer) {
      if (readGroupCount(g as GroupCountRow) < 2) continue;
      const row = out.get((g as { buyerId: string }).buyerId);
      if (row) row.repeatCustomers += 1;
    }

    const reviewsLeft = new Map<string, number>();
    for (const g of reviewsLeftProduct) {
      const buyerId = (g as { buyerId: string }).buyerId;
      reviewsLeft.set(
        buyerId,
        (reviewsLeft.get(buyerId) ?? 0) + readGroupCount(g as GroupCountRow),
      );
    }
    for (const g of reviewsLeftDeal) {
      const reviewerId = (g as { reviewerId: string }).reviewerId;
      reviewsLeft.set(
        reviewerId,
        (reviewsLeft.get(reviewerId) ?? 0) + readGroupCount(g as GroupCountRow),
      );
    }
    for (const g of reviewsLeftDelivery) {
      const reviewerId = (g as { reviewerId: string }).reviewerId;
      reviewsLeft.set(
        reviewerId,
        (reviewsLeft.get(reviewerId) ?? 0) + readGroupCount(g as GroupCountRow),
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
  } catch (error) {
    console.error('[discovery/trust] fetchSellerTrustSnapshots failed:', error);
  }

  return out;
}
