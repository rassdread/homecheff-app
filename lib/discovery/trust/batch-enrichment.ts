import type { DiscoveryTrustBadge } from '../contracts/discovery-read-model';
import type { DiscoveryEnrichment } from '../mappers/enrichment';
import { fetchSellerTrustSnapshots } from './fetch-seller-trust-snapshots';
import type { SellerTrustSnapshot } from './types';

export type SellerTrustBundle = {
  snapshot: SellerTrustSnapshot;
  trustBadges: DiscoveryTrustBadge[];
};

/**
 * Batch-fetch seller trust snapshots + optional badge map merge.
 * Fixed query rounds — see TRUST_ENRICHMENT_PERFORMANCE.md.
 */
export async function fetchSellerTrustBundles(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
): Promise<Map<string, SellerTrustBundle>> {
  const snapshots = await fetchSellerTrustSnapshots(userIds);
  const out = new Map<string, SellerTrustBundle>();
  for (const [uid, snapshot] of snapshots) {
    out.set(uid, {
      snapshot,
      trustBadges: badgeMap?.get(uid) ?? [],
    });
  }
  return out;
}

export function discoveryEnrichmentFromBundle(
  bundle: SellerTrustBundle | null | undefined,
  options: {
    productReviewCount?: number;
    listingIsActive?: boolean;
  } = {},
): DiscoveryEnrichment {
  if (!bundle) {
    return {
      productReviewCount: options.productReviewCount,
      listingIsActive: options.listingIsActive,
    };
  }
  return {
    productReviewCount: options.productReviewCount,
    listingIsActive: options.listingIsActive,
    sellerTrustSnapshot: bundle.snapshot,
    trustBadges: bundle.trustBadges,
  };
}
