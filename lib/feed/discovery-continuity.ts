/**
 * Discovery continuity under search/category/filter constraints.
 *
 * Exact matches always win. When exact supply is empty or sparse, show an
 * honest band + CTA, then continue the normal mixed discovery feed.
 * Never replace HomeCheff with a dead empty page while discovery candidates exist.
 */

export const FEED_EXACT_SPARSE_THRESHOLD = 5;

export function hasActiveFeedDiscoveryConstraint(input: {
  searchQuery: string;
  category: string;
  feedChip: string;
  acceptedValues: readonly string[];
  priceMin?: string;
  priceMax?: string;
  /** Nearby with an explicit radius */
  nearbyRadiusActive?: boolean;
  /** User set place / GPS / profile / country location */
  locationConstraintActive?: boolean;
}): boolean {
  if (input.searchQuery.trim()) return true;
  if (input.category && input.category !== 'all') return true;
  if (input.feedChip && input.feedChip !== 'all') return true;
  if (input.acceptedValues.length > 0) return true;
  if (input.priceMin?.trim() || input.priceMax?.trim()) return true;
  if (input.nearbyRadiusActive) return true;
  if (input.locationConstraintActive) return true;
  return false;
}

/**
 * Band (message + CTA) when the user constrained discovery and exact supply
 * is empty or below the sparse threshold.
 */
export function shouldShowDiscoveryContinuityBand(input: {
  exactMatchCount: number;
  hasActiveConstraint: boolean;
  /** Hydrated + not mid-search flash */
  settled: boolean;
}): boolean {
  if (!input.settled) return false;
  if (!input.hasActiveConstraint) return false;
  return input.exactMatchCount < FEED_EXACT_SPARSE_THRESHOLD;
}

/**
 * Continue the mixed discovery feed under the band when candidates exist.
 */
export function shouldRenderDiscoveryContinuityFeed(input: {
  showBand: boolean;
  continuityCandidateCount: number;
}): boolean {
  return input.showBand && input.continuityCandidateCount > 0;
}

/** Deduplicate continuity rows against already-shown exact match ids. */
export function filterContinuityRowsByExactIds<T extends { id: string }>(
  rows: T[],
  exactIds: ReadonlySet<string>,
): T[] {
  if (exactIds.size === 0) return rows;
  return rows.filter((row) => !exactIds.has(row.id));
}
