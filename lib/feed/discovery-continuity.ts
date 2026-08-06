/**
 * Discovery continuity under search/category/filter constraints.
 *
 * Exact matches always win. When the composition layer judges the exact set
 * insufficient for a natural HomeCheff experience, show an honest band + CTA,
 * then continue the normal mixed discovery feed.
 * Never replace HomeCheff with a dead empty page while discovery candidates exist.
 *
 * Continuity decisions are owned by feed-composition-policy — this module is
 * the thin bridge for constraint detection and UI gating.
 */

import {
  isExactDiscoveryCompositionSufficient,
  type ExactDiscoveryCompositionSignals,
} from '@/lib/feed/feed-composition-policy';

export type {
  ExactDiscoveryCompositionSignals,
  ExactDiscoveryCompositionSufficiency,
} from '@/lib/feed/feed-composition-policy';

export { isExactDiscoveryCompositionSufficient };

export type ExactDiscoveryCompositionItem = {
  id: string;
  /** Stable creator/seller id when known; falls back to item id */
  creatorId: string | null;
  kind: 'sale' | 'inspiration' | 'other';
};

/** Summarize exact rows into composition signals (no presentation thresholds). */
export function buildExactDiscoveryCompositionSignals(input: {
  items: readonly ExactDiscoveryCompositionItem[];
  localSaleCount?: number;
  progressiveWidenActive?: boolean;
  inspirationCompositionWidened?: boolean;
}): ExactDiscoveryCompositionSignals {
  const ids = new Set<string>();
  const creators = new Set<string>();
  const kinds = new Set<ExactDiscoveryCompositionItem['kind']>();

  for (const item of input.items) {
    ids.add(item.id);
    const creator = item.creatorId?.trim();
    creators.add(creator && creator.length > 0 ? creator : `item:${item.id}`);
    kinds.add(item.kind);
  }

  return {
    uniqueItemCount: ids.size,
    uniqueCreatorCount: creators.size,
    contentKindCount: kinds.size,
    localSaleCount: input.localSaleCount,
    progressiveWidenActive: input.progressiveWidenActive,
    inspirationCompositionWidened: input.inspirationCompositionWidened,
  };
}

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
 * Band (message + CTA) when the user constrained discovery and composition
 * judges the exact set insufficient for a natural HomeCheff experience.
 */
export function shouldShowDiscoveryContinuityBand(input: {
  hasActiveConstraint: boolean;
  /** Hydrated + not mid-search flash */
  settled: boolean;
  composition: ExactDiscoveryCompositionSignals;
}): boolean {
  if (!input.settled) return false;
  if (!input.hasActiveConstraint) return false;
  return !isExactDiscoveryCompositionSufficient(input.composition).sufficient;
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
