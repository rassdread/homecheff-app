/**
 * Shared route param + API path helpers for product/request detail pages.
 */

import { resolveListingIdFromParam } from '@/lib/seo/listing-routes';

export type ListingDetailLoadError =
  | 'missing_param'
  | 'not_found'
  | 'network'
  | 'invalid';

export function resolveListingDetailRouteParam(
  params: Record<string, string | string[] | undefined> | null | undefined,
): string | null {
  if (!params) return null;
  const id = params.id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  const slug = params.slug;
  if (typeof slug === 'string' && slug.trim()) return slug.trim();
  return null;
}

/** API accepts slug or bare UUID — always encode for fetch. */
export function listingDetailApiPath(routeParam: string): string {
  return `/api/products/${encodeURIComponent(routeParam)}`;
}

export function listingDetailResolvedId(routeParam: string): string {
  return resolveListingIdFromParam(routeParam);
}
