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
    (entry) => entry.parentId === parentId,
  );
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
