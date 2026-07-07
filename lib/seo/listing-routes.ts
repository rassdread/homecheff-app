/**
 * Canonical listing detail routes — ADR Phase 2.
 * REQUEST → /request/[slug]; OFFER kinds → /product/[slug].
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { isRequestListing } from '@/lib/marketplace/product-visibility';
import {
  buildProductSlugPath,
  resolveProductIdFromParam,
  isBareProductUuidParam,
  PRODUCT_SLUG_ID_MARKER,
} from './productSlug';

export type ListingDetailRoutePrefix = 'product' | 'request';

export function listingDetailRoutePrefix(input: {
  listingKind?: ListingKind | string | null;
  listingIntent?: string | null;
}): ListingDetailRoutePrefix {
  if (input.listingKind === 'REQUEST') return 'request';
  if (isRequestListing(input)) return 'request';
  return 'product';
}

export function buildListingSlugSegment(
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  return buildProductSlugPath(title, place, id);
}

export function buildListingDetailPath(
  prefix: ListingDetailRoutePrefix,
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  const segment = buildListingSlugSegment(title, place, id);
  return `/${prefix}/${segment}`;
}

export function buildListingDetailHref(input: {
  listingKind?: ListingKind | string | null;
  listingIntent?: string | null;
  title: string;
  place?: string | null;
  id: string;
}): string {
  const prefix = listingDetailRoutePrefix(input);
  return buildListingDetailPath(
    prefix,
    input.title,
    input.place ?? null,
    input.id,
  );
}

export function resolveListingIdFromParam(param: string): string {
  return resolveProductIdFromParam(param);
}

export function isBareListingUuidParam(param: string): boolean {
  return isBareProductUuidParam(param);
}

export { PRODUCT_SLUG_ID_MARKER };
