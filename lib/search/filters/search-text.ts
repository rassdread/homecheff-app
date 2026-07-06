import type { SearchableListingRecord } from '../contracts/search-contract';
import { inferSearchQueryIntent } from '../infer-query-intent';
import { toSearchableListingRecord } from '@/lib/discovery/consumer-accessors';

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
    item.listingKind,
    item.listingIntent,
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
  const resolved = toSearchableListingRecord(item);
  const term = normalizeTerm(q);
  if (!term) return true;

  const haystack = haystackForItem(resolved);
  if (haystack.includes(term)) return true;

  const words = term.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => haystack.includes(w))) {
    return true;
  }

  const intent = inferSearchQueryIntent(term);
  if (
    intent.suggestsRequest &&
    (resolved.listingIntent === 'REQUEST' || resolved.listingKind === 'REQUEST')
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
