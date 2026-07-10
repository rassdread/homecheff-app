/**
 * Feed entity → detail route → API contract (Phase 13I-P0 SSOT).
 */

import type { FeedClassifiable } from '@/lib/feed/feed-types';
import { resolveFeedItemHref } from '@/lib/feed/feed-item-href';
import { deriveFeedTaxonomy } from '@/lib/feed/feed-taxonomy';
import {
  listingDetailApiPath,
  listingDetailResolvedId,
} from '@/lib/marketplace/detail/listing-detail-route';

export type ListingDetailEntityKind =
  | 'PRODUCT'
  | 'REQUEST'
  | 'SERVICE'
  | 'DISH'
  | 'LEGACY_LISTING'
  | 'INSPIRATION'
  | 'GARDEN'
  | 'DESIGN'
  | 'BARTER'
  | 'TASK';

export type ListingDetailRouteContract = {
  entityKind: ListingDetailEntityKind;
  feedSource: string;
  detailRoutePrefix: '/product/' | '/request/' | '/recipe/' | '/garden/' | '/design/' | '/inspiratie/';
  usesListingDetailPage: boolean;
  apiPathPattern: '/api/products/[id]' | 'server-inspiratie-loader' | '/inspiratie-api';
  dbModel: 'Product' | 'Listing' | 'Dish' | 'mixed';
};

function routePrefixFromHref(href: string): ListingDetailRouteContract['detailRoutePrefix'] {
  if (href.startsWith('/request/')) return '/request/';
  if (href.startsWith('/recipe/')) return '/recipe/';
  if (href.startsWith('/garden/')) return '/garden/';
  if (href.startsWith('/design/')) return '/design/';
  if (href.startsWith('/inspiratie')) return '/inspiratie/';
  return '/product/';
}

function entityKindFromItem(
  item: FeedClassifiable,
  href: string,
): ListingDetailEntityKind {
  const source = String(item.feedSource ?? item.type ?? '').toUpperCase();
  const tax = deriveFeedTaxonomy(item);

  if (tax.direction === 'REQUEST') {
    return 'REQUEST';
  }
  if (source === 'DISH' || tax.kind === 'INSPIRATION') {
    if (href.startsWith('/garden/')) return 'GARDEN';
    if (href.startsWith('/design/')) return 'DESIGN';
    if (href.startsWith('/inspiratie')) return 'INSPIRATION';
    return 'DISH';
  }
  if (source === 'LISTING') return 'LEGACY_LISTING';
  if (tax.kind === 'SERVICE') return 'SERVICE';
  if (tax.kind === 'BARTER') return 'BARTER';
  if (tax.kind === 'TASK') return 'TASK';
  return 'PRODUCT';
}

export function resolveListingDetailContract(
  item: FeedClassifiable,
): ListingDetailRouteContract & { href: string; resolvedId: string; apiPath: string | null } {
  const tax = deriveFeedTaxonomy(item);
  const href = resolveFeedItemHref(item, tax);
  const prefix = routePrefixFromHref(href);
  const entityKind = entityKindFromItem(item, href);
  const usesListingDetailPage =
    prefix === '/product/' || prefix === '/request/';
  const segment = href.replace(/^\/(product|request)\//, '').replace(/\/$/, '');
  const resolvedId = usesListingDetailPage
    ? listingDetailResolvedId(segment)
    : item.id;
  const apiPath = usesListingDetailPage ? listingDetailApiPath(segment) : null;

  let apiPathPattern: ListingDetailRouteContract['apiPathPattern'];
  let dbModel: ListingDetailRouteContract['dbModel'];
  if (usesListingDetailPage) {
    apiPathPattern = '/api/products/[id]';
    dbModel = entityKind === 'LEGACY_LISTING' ? 'Listing' : 'Product';
  } else if (prefix === '/inspiratie/') {
    apiPathPattern = '/inspiratie-api';
    dbModel = 'Dish';
  } else {
    apiPathPattern = 'server-inspiratie-loader';
    dbModel = 'Dish';
  }

  return {
    entityKind,
    feedSource: String(item.feedSource ?? item.type ?? 'unknown'),
    detailRoutePrefix: prefix,
    usesListingDetailPage,
    apiPathPattern,
    dbModel,
    href,
    resolvedId,
    apiPath,
  };
}

/** True when a non-product row is incorrectly routed to /product/. */
export function isUniversalProductFallback(
  item: FeedClassifiable,
): boolean {
  const contract = resolveListingDetailContract(item);
  const tax = deriveFeedTaxonomy(item);
  if (tax.kind === 'INSPIRATION') {
    return contract.detailRoutePrefix === '/product/';
  }
  if (tax.direction === 'REQUEST') {
    return contract.detailRoutePrefix === '/product/';
  }
  return false;
}
