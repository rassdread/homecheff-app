/**
 * Trust enrichment wall-clock sub-buckets (Phase 3B instrumentation).
 */

import { isFeedApiTimingEnabled } from '@/lib/feed/feed-api-timing';
import { fetchSellerTrustBundles } from '@/lib/discovery/trust/batch-enrichment';
import type { DiscoveryTrustBadge } from '@/lib/discovery/contracts/discovery-read-model';

export type TrustEnrichmentTiming = {
  totalMs: number;
  badgesMs: number;
  bundlesMs: number;
  sellerCount: number;
};

export async function fetchSellerTrustBundlesWithTiming(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
): Promise<{
  bundles: Awaited<ReturnType<typeof fetchSellerTrustBundles>>;
  timing: TrustEnrichmentTiming | null;
}> {
  if (!isFeedApiTimingEnabled()) {
    const bundles = await fetchSellerTrustBundles(userIds, badgeMap);
    return { bundles, timing: null };
  }

  const totalStart = performance.now();
  const badgesMs = 0;
  const bundlesStart = performance.now();
  const bundles = await fetchSellerTrustBundles(userIds, badgeMap);
  const bundlesMs = Math.round(performance.now() - bundlesStart);

  return {
    bundles,
    timing: {
      totalMs: Math.round(performance.now() - totalStart),
      badgesMs,
      bundlesMs,
      sellerCount: [...new Set(userIds.filter(Boolean))].length,
    },
  };
}

/**
 * Tile trust fields used on feed cards (minimal).
 * Extended trust (capabilities, repeat customers) is discovery.trust block.
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

export const FEED_EXTENDED_TRUST_FIELDS = [
  'repeatCustomers',
  'businessPlan',
  'hasSellerCapability',
  'hasCourierCapability',
  'hasCreatorCapability',
  'buyerTier',
  'courierTier',
] as const;
