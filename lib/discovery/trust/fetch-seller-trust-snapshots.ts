/**
 * Batch-fetch seller trust snapshots — avoids N+1 per listing.
 * Phase 3C: minimal tile path + per-query timing.
 */

import { prisma } from '@/lib/prisma';
import { resolveBusinessPlanId } from '@/lib/business/visibility-profile';
import { filterTrustBadgeSlugs } from './trust-badge-utils';
import { emptySellerTrustSnapshot, type SellerTrustSnapshot } from './types';
import type {
  TrustSnapshotQueryTiming,
  TrustSnapshotTimingReport,
} from './trust-snapshot-timing';

const DELIVERED_ORDER_STATUSES = ['DELIVERED', 'SHIPPED', 'CONFIRMED'] as const;

export type FetchSellerTrustSnapshotsOptions = {
  /** minimal = feed tile + ranking; full = includes buyer-tier evidence */
  mode?: 'minimal' | 'full';
  collectTiming?: boolean;
};

type GroupCountRow = { _count: { _all: number } };

function readGroupCount(row: GroupCountRow): number {
  return row._count._all ?? 0;
}

async function timedQuery<T>(
  key: string,
  label: string,
  models: string[],
  requiredForTile: boolean,
  timings: TrustSnapshotQueryTiming[],
  fn: () => Promise<T>,
): Promise<T> {
  const wallStart = performance.now();
  const result = await fn();
  const wallMs = Math.round(performance.now() - wallStart);
  timings.push({
    key,
    label,
    wallMs,
    prismaMs: wallMs,
    queryCount: 1,
    models,
    mode: 'batch',
    requiredForTile,
  });
  return result;
}

async function countDeliveredOrderItemsByProductId(
  productIds: string[],
  timings: TrustSnapshotQueryTiming[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await timedQuery(
    'order_items',
    'Delivered order items by product',
    ['OrderItem', 'Order'],
    true,
    timings,
    () =>
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          Order: { status: { in: [...DELIVERED_ORDER_STATUSES] } },
        },
        _count: { _all: true },
      }),
  );
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.productId) {
      totals.set(row.productId, row._count._all ?? 0);
    }
  }
  return totals;
}

function assembleSnapshots(
  unique: string[],
  sellerProfiles: Awaited<ReturnType<typeof prisma.sellerProfile.findMany>>,
  deliveryProfiles: Awaited<ReturnType<typeof prisma.deliveryProfile.findMany>>,
  sellerProducts: Array<{ id: string; sellerId: string }>,
  activeListingCounts: GroupCountRow[],
  dealReviewAggs: GroupCountRow[],
  productReviewByProduct: GroupCountRow[],
  deliveryReviewAggs: GroupCountRow[],
  completedAsSeller: GroupCountRow[],
  completedAsBuyer: GroupCountRow[],
  completedDeliveries: GroupCountRow[],
  productOrderCounts: Map<string, number>,
  dealPairsAsSeller: GroupCountRow[],
  dealPairsAsBuyer: GroupCountRow[],
  reviewsLeftProduct: GroupCountRow[],
  reviewsLeftDeal: GroupCountRow[],
  reviewsLeftDelivery: GroupCountRow[],
  userBadges: Array<{ userId: string; badge: { slug: string } }>,
): Map<string, SellerTrustSnapshot> {
  const out = new Map<string, SellerTrustSnapshot>();
  for (const uid of unique) {
    out.set(uid, emptySellerTrustSnapshot(uid));
  }

  const productSeller = new Map(sellerProducts.map((p) => [p.id, p.sellerId]));
  const sellerIdToUserId = new Map<string, string>();
  for (const sp of sellerProfiles) {
    sellerIdToUserId.set(sp.id, sp.userId);
    const row = out.get(sp.userId)!;
    row.hasSellerProfile = true;
    row.businessPlan = resolveBusinessPlanId({
      subscriptionId: sp.subscriptionId,
      subscriptionValidUntil: sp.subscriptionValidUntil,
      Subscription: sp.Subscription,
    });
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

  return out;
}

export async function fetchSellerTrustSnapshots(
  userIds: string[],
  options: FetchSellerTrustSnapshotsOptions = {},
): Promise<Map<string, SellerTrustSnapshot>> {
  const result = await fetchSellerTrustSnapshotsWithReport(userIds, options);
  return result.snapshots;
}

export async function fetchSellerTrustSnapshotsWithReport(
  userIds: string[],
  options: FetchSellerTrustSnapshotsOptions = {},
): Promise<{
  snapshots: Map<string, SellerTrustSnapshot>;
  timing: TrustSnapshotTimingReport | null;
}> {
  const mode = options.mode ?? 'full';
  const unique = [...new Set(userIds.filter(Boolean))];
  const timings: TrustSnapshotQueryTiming[] = [];
  const totalStart = performance.now();

  const emptyOut = () => {
    const out = new Map<string, SellerTrustSnapshot>();
    for (const uid of unique) out.set(uid, emptySellerTrustSnapshot(uid));
    return out;
  };

  if (unique.length === 0) {
    return { snapshots: new Map(), timing: null };
  }

  try {
    const [sellerProfiles, deliveryProfiles] = await Promise.all([
      timedQuery(
        'seller_profiles',
        'Seller profiles',
        ['SellerProfile', 'Subscription'],
        true,
        timings,
        () =>
          prisma.sellerProfile.findMany({
            where: { userId: { in: unique } },
            select: {
              id: true,
              userId: true,
              subscriptionId: true,
              subscriptionValidUntil: true,
              Subscription: { select: { name: true, feeBps: true } },
            },
          }),
      ),
      timedQuery(
        'delivery_profiles',
        'Delivery profiles',
        ['DeliveryProfile'],
        false,
        timings,
        () =>
          prisma.deliveryProfile.findMany({
            where: { userId: { in: unique } },
            select: { id: true, userId: true },
          }),
      ),
    ]);

    const sellerProfileIds = sellerProfiles.map((sp) => sp.id);
    const deliveryProfileIds = deliveryProfiles.map((dp) => dp.id);

    const sellerProducts =
      sellerProfileIds.length > 0
        ? await timedQuery(
            'seller_products',
            'Seller product ids',
            ['Product'],
            true,
            timings,
            () =>
              prisma.product.findMany({
                where: { sellerId: { in: sellerProfileIds } },
                select: { id: true, sellerId: true },
              }),
          )
        : [];
    const productIds = sellerProducts.map((p) => p.id);

    const includeExtended = mode === 'full';

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
        ? timedQuery(
            'active_listings',
            'Active listing counts',
            ['Product'],
            true,
            timings,
            () =>
              prisma.product.groupBy({
                by: ['sellerId'],
                where: { isActive: true, sellerId: { in: sellerProfileIds } },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      timedQuery(
        'deal_reviews',
        'Deal reviews received',
        ['DealReview'],
        true,
        timings,
        () =>
          prisma.dealReview.groupBy({
            by: ['revieweeId'],
            where: { revieweeId: { in: unique } },
            _count: { _all: true },
          }),
      ),
      productIds.length > 0
        ? timedQuery(
            'product_reviews',
            'Product reviews by product',
            ['ProductReview'],
            true,
            timings,
            () =>
              prisma.productReview.groupBy({
                by: ['productId'],
                where: {
                  productId: { in: productIds },
                  reviewSubmittedAt: { not: null },
                  rating: { gt: 0 },
                },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      deliveryProfileIds.length > 0
        ? timedQuery(
            'delivery_reviews',
            'Courier reviews received',
            ['DeliveryReview'],
            true,
            timings,
            () =>
              prisma.deliveryReview.groupBy({
                by: ['deliveryProfileId'],
                where: { deliveryProfileId: { in: deliveryProfileIds } },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      timedQuery(
        'completed_as_seller',
        'Completed deals as seller',
        ['CommunityOrder'],
        true,
        timings,
        () =>
          prisma.communityOrder.groupBy({
            by: ['sellerId'],
            where: { sellerId: { in: unique }, status: 'COMPLETED' },
            _count: { _all: true },
          }),
      ),
      includeExtended
        ? timedQuery(
            'completed_as_buyer',
            'Completed deals as buyer',
            ['CommunityOrder'],
            false,
            timings,
            () =>
              prisma.communityOrder.groupBy({
                by: ['buyerId'],
                where: { buyerId: { in: unique }, status: 'COMPLETED' },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      timedQuery(
        'completed_deliveries',
        'Completed deliveries',
        ['CourierAssignment'],
        true,
        timings,
        () =>
          prisma.courierAssignment.groupBy({
            by: ['courierId'],
            where: { courierId: { in: unique }, status: 'COMPLETED' },
            _count: { _all: true },
          }),
      ),
      countDeliveredOrderItemsByProductId(productIds, timings),
      timedQuery(
        'repeat_customers_seller',
        'Repeat customers (seller)',
        ['CommunityOrder'],
        true,
        timings,
        () =>
          prisma.communityOrder.groupBy({
            by: ['sellerId', 'buyerId'],
            where: { sellerId: { in: unique }, status: 'COMPLETED' },
            _count: { _all: true },
          }),
      ),
      includeExtended
        ? timedQuery(
            'repeat_customers_buyer',
            'Repeat customers (buyer)',
            ['CommunityOrder'],
            false,
            timings,
            () =>
              prisma.communityOrder.groupBy({
                by: ['buyerId', 'sellerId'],
                where: { buyerId: { in: unique }, status: 'COMPLETED' },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      includeExtended
        ? timedQuery(
            'reviews_left_product',
            'Reviews left (product)',
            ['ProductReview'],
            false,
            timings,
            () =>
              prisma.productReview.groupBy({
                by: ['buyerId'],
                where: { buyerId: { in: unique }, reviewSubmittedAt: { not: null } },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      includeExtended
        ? timedQuery(
            'reviews_left_deal',
            'Reviews left (deal)',
            ['DealReview'],
            false,
            timings,
            () =>
              prisma.dealReview.groupBy({
                by: ['reviewerId'],
                where: { reviewerId: { in: unique } },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      includeExtended
        ? timedQuery(
            'reviews_left_delivery',
            'Reviews left (delivery)',
            ['DeliveryReview'],
            false,
            timings,
            () =>
              prisma.deliveryReview.groupBy({
                by: ['reviewerId'],
                where: { reviewerId: { in: unique } },
                _count: { _all: true },
              }),
          )
        : Promise.resolve([] as GroupCountRow[]),
      timedQuery(
        'trust_badges',
        'Trust badge slugs',
        ['UserBadge', 'Badge'],
        true,
        timings,
        () =>
          prisma.userBadge.findMany({
            where: { userId: { in: unique } },
            include: { badge: { select: { slug: true } } },
          }),
      ),
    ]);

    const assemblyStart = performance.now();
    const snapshots = assembleSnapshots(
      unique,
      sellerProfiles,
      deliveryProfiles,
      sellerProducts,
      activeListingCounts as GroupCountRow[],
      dealReviewAggs as GroupCountRow[],
      productReviewByProduct as GroupCountRow[],
      deliveryReviewAggs as GroupCountRow[],
      completedAsSeller as GroupCountRow[],
      completedAsBuyer as GroupCountRow[],
      completedDeliveries as GroupCountRow[],
      productOrderCounts,
      dealPairsAsSeller as GroupCountRow[],
      dealPairsAsBuyer as GroupCountRow[],
      reviewsLeftProduct as GroupCountRow[],
      reviewsLeftDeal as GroupCountRow[],
      reviewsLeftDelivery as GroupCountRow[],
      userBadges,
    );
    const assemblyMs = Math.round(performance.now() - assemblyStart);

    const timing: TrustSnapshotTimingReport | null = options.collectTiming
      ? {
          totalWallMs: Math.round(performance.now() - totalStart),
          prismaTotalMs: timings.reduce((sum, q) => sum + q.prismaMs, 0),
          queryCount: timings.reduce((sum, q) => sum + q.queryCount, 0),
          sellerCount: unique.length,
          mode,
          queries: timings,
          assemblyMs,
        }
      : null;

    return { snapshots, timing };
  } catch (error) {
    console.error('[discovery/trust] fetchSellerTrustSnapshots failed:', error);
    return { snapshots: emptyOut(), timing: null };
  }
}
