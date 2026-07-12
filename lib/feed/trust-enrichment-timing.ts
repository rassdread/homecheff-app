/**
 * Trust enrichment wall-clock sub-buckets (Phase 3B + 3C instrumentation).
 */

import { isFeedApiTimingEnabled } from '@/lib/feed/feed-api-timing';
import { fetchSellerTrustBundlesWithReport } from '@/lib/discovery/trust/batch-enrichment';
import type { DiscoveryTrustBadge } from '@/lib/discovery/contracts/discovery-read-model';
import type { TrustSnapshotTimingReport } from '@/lib/discovery/trust/trust-snapshot-timing';
import type { TrustSnapshotCacheStats } from '@/lib/discovery/trust/trust-snapshot-cache';

export type TrustEnrichmentTiming = {
  totalMs: number;
  badgesMs: number;
  bundlesMs: number;
  sellerCount: number;
  mode: 'minimal' | 'full';
  snapshotTiming?: TrustSnapshotTimingReport;
  cacheStats?: TrustSnapshotCacheStats;
};

export async function fetchSellerTrustBundlesWithTiming(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
): Promise<{
  bundles: Awaited<
    ReturnType<typeof fetchSellerTrustBundlesWithReport>
  >['bundles'];
  timing: TrustEnrichmentTiming | null;
}> {
  const trustMode = 'minimal' as const;
  const collectTiming = isFeedApiTimingEnabled();
  const sellerCount = [...new Set(userIds.filter(Boolean))].length;

  const totalStart = performance.now();
  const bundlesStart = performance.now();
  const { bundles, snapshotTiming, cacheStats } = await fetchSellerTrustBundlesWithReport(
    userIds,
    badgeMap,
    {
      mode: trustMode,
      collectTiming,
      useCache: true,
    },
  );
  const bundlesMs = Math.round(performance.now() - bundlesStart);

  if (!collectTiming) {
    return { bundles, timing: null };
  }

  return {
    bundles,
    timing: {
      totalMs: Math.round(performance.now() - totalStart),
      badgesMs: 0,
      bundlesMs,
      sellerCount,
      mode: trustMode,
      snapshotTiming: snapshotTiming ?? undefined,
      cacheStats,
    },
  };
}

/**
 * Minimal tile trust — rendered on feed cards and used for discovery ranking.
 */
export const FEED_TILE_TRUST_FIELDS = [
  'productReviewCount',
  'dealReviewCount',
  'courierReviewCount',
  'completedDeals',
  'completedDeliveries',
  'sellerTier',
  'trustBadges',
] as const;

/**
 * Extended trust — buyer tier, reviews-left, buyer-side repeat (deferred in minimal mode).
 */
export const FEED_EXTENDED_TRUST_FIELDS = [
  'repeatCustomers',
  'businessPlan',
  'hasSellerCapability',
  'hasCourierCapability',
  'hasCreatorCapability',
  'buyerTier',
  'courierTier',
  'reviewsLeftCount',
  'completedDealsAsBuyer',
] as const;

/**
 * Fields safe to default in minimal mode without tile UI regression.
 */
export const FEED_MINIMAL_TRUST_DEFAULTS = {
  buyerTier: 0,
  reviewsLeftCount: 0,
  completedDealsAsBuyer: 0,
} as const;
