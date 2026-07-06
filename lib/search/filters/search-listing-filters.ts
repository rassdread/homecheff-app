import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { inferListingKindEntityType } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import type {
  SearchableListingRecord,
  SearchFilterParams,
} from '../contracts/search-contract';
import { inferSearchQueryIntent } from '../infer-query-intent';

function normalizeListingKinds(
  value: SearchFilterParams['listingKind'],
): ListingKind[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveItemListingKind(item: SearchableListingRecord): ListingKind {
  if (item.listingKind) return item.listingKind;
  return deriveListingKind({
    entityType: item.entityType ?? inferListingKindEntityType(item),
    listingIntent: item.listingIntent ?? null,
    marketplaceCategory: item.marketplaceCategory ?? null,
    specializations: item.specializations ?? null,
    subcategory: item.subcategory ?? null,
    category: item.category ?? null,
    feedSource: item.feedSource ?? null,
    type: item.type ?? null,
  }).listingKind;
}

function matchesListingIntent(
  item: SearchableListingRecord,
  intent: SearchFilterParams['listingIntent'],
): boolean {
  if (!intent) return true;
  const raw = String(item.listingIntent ?? 'OFFER').trim().toUpperCase();
  return raw === intent;
}

function matchesMarketplaceCategory(
  item: SearchableListingRecord,
  categories: SearchFilterParams['marketplaceCategory'],
): boolean {
  if (!categories) return true;
  const list = Array.isArray(categories) ? categories : [categories];
  if (list.length === 0) return true;
  const itemCat = String(item.marketplaceCategory ?? '').trim().toUpperCase();
  return list.some((c) => itemCat === String(c).trim().toUpperCase());
}

function matchesSpecializations(
  item: SearchableListingRecord,
  specs: SearchFilterParams['specializations'],
): boolean {
  if (!specs?.length) return true;
  const itemSpecs = new Set(
    (item.specializations ?? []).map((s) => s.toLowerCase()),
  );
  return specs.some((s) => itemSpecs.has(s.toLowerCase()));
}

function matchesBarterOpenness(
  item: SearchableListingRecord,
  openness: SearchFilterParams['barterOpenness'],
): boolean {
  if (!openness) return true;
  const list = Array.isArray(openness) ? openness : [openness];
  const raw = String(item.barterOpenness ?? '').trim().toUpperCase();
  return list.some((o) => raw === String(o).trim().toUpperCase());
}

/**
 * Structured ListingKind / taxonomy filters — no ranking impact.
 */
export function matchesSearchListingFilters(
  item: SearchableListingRecord,
  filters: SearchFilterParams,
): boolean {
  const kindFilters = normalizeListingKinds(filters.listingKind);
  if (kindFilters.length > 0) {
    const kind = resolveItemListingKind(item);
    if (!kindFilters.includes(kind)) return false;
  }

  if (!matchesListingIntent(item, filters.listingIntent ?? null)) return false;
  if (!matchesMarketplaceCategory(item, filters.marketplaceCategory ?? null)) {
    return false;
  }
  if (!matchesSpecializations(item, filters.specializations ?? null)) {
    return false;
  }
  if (!matchesBarterOpenness(item, filters.barterOpenness ?? null)) {
    return false;
  }

  if (filters.q?.trim()) {
    const intent = inferSearchQueryIntent(filters.q);
    if (intent.listingKindHints.length > 0 && kindFilters.length === 0) {
      const kind = resolveItemListingKind(item);
      if (intent.listingKindHints.includes(kind as typeof intent.listingKindHints[number])) {
        return true;
      }
    }
  }

  return true;
}

/** True for Product-backed marketplace listings (includes REQUEST), excludes INSPIRATION. */
export function isSearchableMarketplaceListing(
  item: SearchableListingRecord,
): boolean {
  const kind = resolveItemListingKind(item);
  return kind !== 'INSPIRATION';
}

export function parseListingKindParam(
  raw: string | null | undefined,
): ListingKind[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean) as ListingKind[];
}

export function parseSearchFilterParams(
  searchParams: URLSearchParams,
): SearchFilterParams {
  const listingIntentRaw = searchParams.get('listingIntent');
  const listingIntent =
    listingIntentRaw?.trim().toUpperCase() === 'REQUEST' ? 'REQUEST' : listingIntentRaw?.trim().toUpperCase() === 'OFFER' ? 'OFFER' : null;

  return {
    q: searchParams.get('q'),
    listingKind: (() => {
      const kinds = parseListingKindParam(searchParams.get('listingKind'));
      return kinds.length > 0 ? kinds : null;
    })(),
    listingIntent,
    specializations: searchParams
      .get('specializations')
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    barterOpenness: searchParams.get('barterOpenness') as SearchFilterParams['barterOpenness'],
    legacyCategory: searchParams.get('vertical') ?? searchParams.get('category'),
  };
}
