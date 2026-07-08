/**
 * Accepted Values reverse discovery — Phase 8B.
 *
 * Client-side filter: show listings that accept a value the viewer can offer.
 * Uses the same taxonomy ids as AcceptedValuesPicker / acceptedSpecializations.
 */

import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { acceptedValueIdAllowed } from '@/lib/marketplace/pending-accepted-values/resolve-pending-display';

export type AcceptedValuesDiscoveryItem = {
  acceptedSpecializations?: string[] | null;
  discovery?: {
    acceptedSpecializations?: string[] | null;
    acceptedValueSubcategories?: string[] | null;
  } | null;
};

/** Normalize item payload → accepted-value taxonomy item ids only. */
export function extractItemAcceptedValueIds(
  item: AcceptedValuesDiscoveryItem,
): string[] {
  const raw =
    item.acceptedSpecializations ??
    item.discovery?.acceptedValueSubcategories ??
    item.discovery?.acceptedSpecializations ??
    [];

  return normalizeAcceptedTaxonomyIds(raw).filter((id) => acceptedValueIdAllowed(id));
}

/**
 * Multiple selected values use OR within the filter (any match).
 * Combined with category/search/price via AND in GeoFeed memos.
 */
export function itemMatchesAcceptedValuesDiscoveryFilter(
  item: AcceptedValuesDiscoveryItem,
  selectedIds: string[],
): boolean {
  if (selectedIds.length === 0) return true;
  const itemIds = extractItemAcceptedValueIds(item);
  if (itemIds.length === 0) return false;
  return selectedIds.some((id) => itemIds.includes(id));
}

export function taxonomyIdAllowedInDiscoveryFilter(id: string): boolean {
  return acceptedValueIdAllowed(id);
}

export function filterItemsByAcceptedValues<T extends AcceptedValuesDiscoveryItem>(
  items: T[],
  selectedIds: string[],
): T[] {
  if (selectedIds.length === 0) return items;
  return items.filter((item) =>
    itemMatchesAcceptedValuesDiscoveryFilter(item, selectedIds),
  );
}
