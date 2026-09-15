/**
 * Resolve and filter helpers for marketplace taxonomy registry.
 */

import type { MarketplaceCategory } from '@prisma/client';
import { MARKETPLACE_TAXONOMY } from './taxonomy';
import type {
  MarketplaceTaxonomyItem,
  TaxonomyResolveOptions,
} from './taxonomy-types';

const TAXONOMY_BY_ID = new Map<string, MarketplaceTaxonomyItem>(
  MARKETPLACE_TAXONOMY.map((entry) => [entry.id, entry]),
);

function passesVisibility(
  entry: MarketplaceTaxonomyItem,
  options?: TaxonomyResolveOptions,
): boolean {
  if (entry.blocked && !options?.includeBlocked) return false;
  if (entry.futureOnly && !options?.includeFutureOnly) return false;
  return true;
}

export function getMarketplaceTaxonomyItem(
  id: string,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem | undefined {
  const entry = TAXONOMY_BY_ID.get(id);
  if (!entry) return undefined;
  if (!passesVisibility(entry, options)) return undefined;
  return entry;
}

export function getMarketplaceTaxonomyItems(
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return MARKETPLACE_TAXONOMY.filter((entry) => passesVisibility(entry, options));
}

export function getMarketplaceTaxonomyItemsByCategory(
  category: MarketplaceCategory,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItems(options).filter(
    (entry) => entry.category === category,
  );
}

export function getMarketplaceTaxonomyItemsByParent(
  parentId: string,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItems(options).filter(
    (entry) => entry.parentId === parentId && entry.level === 'item',
  );
}

export function getMarketplaceTaxonomyGroupsByCategory(
  category: MarketplaceCategory,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItems(options).filter(
    (entry) => entry.level === 'group' && entry.category === category,
  );
}

export type TaxonomyEntryRole = 'offer' | 'request';

function itemAllowedForRole(
  entry: MarketplaceTaxonomyItem,
  role: TaxonomyEntryRole,
): boolean {
  if (entry.level !== 'item' || entry.blocked) return false;
  return role === 'request' ? entry.allowedAsRequest : entry.allowedAsOffer;
}

/** Selectable items under a group for entry flow (excludes futureOnly/blocked by default). */
export function getEntryFlowItemsForGroup(
  groupId: string,
  role: TaxonomyEntryRole,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItemsByParent(groupId, options).filter((entry) =>
    itemAllowedForRole(entry, role),
  );
}

/** Items in a category with no group (fallback when taxonomy has no groups). */
export function getEntryFlowFlatItemsForCategory(
  category: MarketplaceCategory,
  role: TaxonomyEntryRole,
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItems(options).filter(
    (entry) =>
      entry.category === category &&
      entry.level === 'item' &&
      !entry.parentId &&
      itemAllowedForRole(entry, role),
  );
}

export function getTaxonomyItemSearchTerms(id: string): string[] {
  const entry = TAXONOMY_BY_ID.get(id);
  return entry?.searchTerms ?? [];
}

const TAXONOMY_QUERY_STOPWORDS = new Set([
  'gezocht',
  'zoekt',
  'zoeken',
  'nodig',
  'needed',
  'wie',
  'kan',
  'help',
]);

function taxonomySearchBlob(entry: MarketplaceTaxonomyItem): string {
  return [entry.id, ...(entry.searchTerms ?? [])]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .toLowerCase();
}

function taxonomyBlobMatchesQuery(blob: string, term: string, topical: string, words: string[]): boolean {
  if (!blob) return false;
  if (blob.includes(term) || (topical && blob.includes(topical))) return true;
  const significant = words.filter((word) => word.length > 2);
  return significant.length > 0 && significant.every((word) => blob.includes(word));
}

/** Canonical ids whose labels/synonyms match a free-text query. Group hits expand to children. */
export function getTaxonomyIdsMatchingSearchQuery(q: string): Set<string> {
  const term = q.trim().toLowerCase();
  const ids = new Set<string>();
  if (!term) return ids;

  const words = term
    .split(/\s+/)
    .filter((word) => word && !TAXONOMY_QUERY_STOPWORDS.has(word));
  const topical = words.join(' ');
  const items = MARKETPLACE_TAXONOMY.filter(
    (entry) => entry.level === 'item' && !entry.blocked,
  );

  for (const group of MARKETPLACE_TAXONOMY) {
    if (group.level !== 'group') continue;
    if (!taxonomyBlobMatchesQuery(taxonomySearchBlob(group), term, topical, words)) {
      continue;
    }
    for (const item of items) {
      if (item.parentId === group.id) ids.add(item.id);
    }
  }

  for (const item of items) {
    if (taxonomyBlobMatchesQuery(taxonomySearchBlob(item), term, topical, words)) {
      ids.add(item.id);
    }
  }

  return ids;
}

export function listingMatchesTaxonomySearchQuery(
  listingTaxonomyIds: Array<string | null | undefined>,
  q: string,
): boolean {
  const wanted = getTaxonomyIdsMatchingSearchQuery(q);
  if (wanted.size === 0) return false;
  return listingTaxonomyIds.some((id) => Boolean(id) && wanted.has(id));
}

function roleFilter(
  role: 'offer' | 'request' | 'acceptedValue',
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return getMarketplaceTaxonomyItems(options).filter((entry) => {
    if (entry.level !== 'item' || entry.blocked) return false;
    if (role === 'offer') return entry.allowedAsOffer;
    if (role === 'request') return entry.allowedAsRequest;
    return entry.allowedAsAcceptedValue;
  });
}

export function getOfferTaxonomyItems(
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return roleFilter('offer', options);
}

export function getRequestTaxonomyItems(
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return roleFilter('request', options);
}

export function getAcceptedValueTaxonomyItems(
  options?: TaxonomyResolveOptions,
): MarketplaceTaxonomyItem[] {
  return roleFilter('acceptedValue', options);
}

export function isMarketplaceTaxonomyItemAllowedAsOffer(id: string): boolean {
  const entry = TAXONOMY_BY_ID.get(id);
  return !!entry && !entry.blocked && entry.allowedAsOffer;
}

export function isMarketplaceTaxonomyItemAllowedAsRequest(id: string): boolean {
  const entry = TAXONOMY_BY_ID.get(id);
  return !!entry && !entry.blocked && entry.allowedAsRequest;
}

export function isMarketplaceTaxonomyItemAllowedAsAcceptedValue(
  id: string,
): boolean {
  const entry = TAXONOMY_BY_ID.get(id);
  return !!entry && !entry.blocked && entry.allowedAsAcceptedValue;
}

export function isBlockedMarketplaceTaxonomyId(id: string): boolean {
  const entry = TAXONOMY_BY_ID.get(id);
  return !!entry?.blocked;
}

export function isFutureOnlyMarketplaceTaxonomyId(id: string): boolean {
  const entry = TAXONOMY_BY_ID.get(id);
  return !!entry?.futureOnly;
}

/** Internal map access for validation scripts */
export function getMarketplaceTaxonomyRegistryMap(): ReadonlyMap<
  string,
  MarketplaceTaxonomyItem
> {
  return TAXONOMY_BY_ID;
}
