import type { SearchableListingRecord } from '../contracts/search-contract';
import { inferSearchQueryIntent } from '../infer-query-intent';

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function haystackForItem(item: SearchableListingRecord): string {
  const parts = [
    item.title,
    item.description,
    item.subcategory,
    item.category,
    item.marketplaceCategory,
    item.seller?.name,
    item.seller?.username,
    item.location?.place,
    item.location?.city,
    ...(item.specializations ?? []),
  ];
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

/**
 * Text match for search — title, description, taxonomy ids, seller, location.
 * When query suggests REQUEST, REQUEST listings match even on weak text overlap.
 */
export function matchesSearchTextQuery(
  item: SearchableListingRecord,
  q: string,
): boolean {
  const term = normalizeTerm(q);
  if (!term) return true;

  const haystack = haystackForItem(item);
  if (haystack.includes(term)) return true;

  const words = term.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => haystack.includes(w))) {
    return true;
  }

  const intent = inferSearchQueryIntent(term);
  if (
    intent.suggestsRequest &&
    (item.listingIntent === 'REQUEST' || item.listingKind === 'REQUEST')
  ) {
    const topical = words.filter(
      (w) =>
        !['gezocht', 'zoekt', 'hulp', 'help', 'nodig', 'wie', 'kan'].includes(w),
    );
    if (topical.length === 0) return true;
    return topical.some((w) => haystack.includes(w));
  }

  return false;
}
