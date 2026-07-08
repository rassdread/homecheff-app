/**
 * Taxonomy-only suggestions when reverse discovery has no matches — Phase 8C.
 * No AI — siblings, parent group peers, and neighbouring groups only.
 */

import {
  getMarketplaceTaxonomyItem,
  getMarketplaceTaxonomyItemsByParent,
  isMarketplaceTaxonomyItemAllowedAsAcceptedValue,
} from '@/lib/marketplace/taxonomy-resolve';
import { isPendingAcceptedValueId } from '@/lib/marketplace/pending-accepted-values/constants';

function officialAcceptedValueIdsFromSelection(selectedIds: string[]): string[] {
  return selectedIds.filter(
    (id) => !isPendingAcceptedValueId(id) && isMarketplaceTaxonomyItemAllowedAsAcceptedValue(id),
  );
}

/** Suggest alternative accepted-value ids (OR expansion hints) from taxonomy hierarchy. */
export function suggestAcceptedValueAlternatives(
  selectedIds: string[],
  max = 8,
): string[] {
  const selected = new Set(selectedIds);
  const suggestions: string[] = [];
  const official = officialAcceptedValueIdsFromSelection(selectedIds);

  for (const id of official) {
    const item = getMarketplaceTaxonomyItem(id);
    if (!item?.parentId) continue;

    const siblings = getMarketplaceTaxonomyItemsByParent(item.parentId).filter(
      (entry) => entry.allowedAsAcceptedValue && entry.id !== id,
    );
    for (const sibling of siblings) {
      if (!selected.has(sibling.id)) suggestions.push(sibling.id);
    }

    const parent = getMarketplaceTaxonomyItem(item.parentId);
    if (parent?.parentId) {
      const cousins = getMarketplaceTaxonomyItemsByParent(parent.parentId).filter(
        (entry) =>
          entry.level === 'item' &&
          entry.allowedAsAcceptedValue &&
          !selected.has(entry.id),
      );
      for (const cousin of cousins) {
        suggestions.push(cousin.id);
      }
    }
  }

  if (suggestions.length < max && official.length === 0) {
    const pendingCategoryHints = selectedIds
      .filter(isPendingAcceptedValueId)
      .map((id) => id.split(':')[1])
      .filter(Boolean);
    if (pendingCategoryHints.length > 0) {
      // No taxonomy anchor for pure pending ids — caller may surface category chips instead.
    }
  }

  return [...new Set(suggestions)].slice(0, max);
}

/** Nearby marketplace category slugs for empty-state hints (canonical model). */
export function suggestNearbyDiscoveryCategories(
  currentCategory: string,
): string[] {
  const order = ['all', 'food', 'garden', 'creations', 'services', 'knowledge'];
  const idx = order.indexOf(currentCategory);
  if (idx < 0) return order.filter((slug) => slug !== 'all').slice(0, 3);
  const neighbours: string[] = [];
  if (order[idx - 1] && order[idx - 1] !== 'all') neighbours.push(order[idx - 1]!);
  if (order[idx + 1]) neighbours.push(order[idx + 1]!);
  return neighbours.filter((slug) => slug !== currentCategory);
}
