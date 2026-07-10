/**
 * Shared route param + API path helpers for product/request detail pages.
 */

import { resolveListingIdFromParam } from '@/lib/seo/listing-routes';
import { resolveClientApiUrl } from '@/lib/client/resolve-api-url';

export type ListingDetailLoadError =
  | 'missing_param'
  | 'not_found'
  | 'network'
  | 'invalid'
  | 'server_error'
  | 'unavailable';

export type ListingDetailKind = 'product' | 'request';

/** Strip query/hash/trailing slash from dynamic route segment. */
export function normalizeListingDetailRouteParam(param: string): string {
  let p = decodeURIComponent(param).trim();
  const q = p.indexOf('?');
  const h = p.indexOf('#');
  const cut = Math.min(q === -1 ? p.length : q, h === -1 ? p.length : h);
  p = p.slice(0, cut);
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function resolveListingDetailRouteParam(
  params: Record<string, string | string[] | undefined> | null | undefined,
): string | null {
  if (!params) return null;
  const id = params.id;
  if (typeof id === 'string' && id.trim()) {
    return normalizeListingDetailRouteParam(id);
  }
  const slug = params.slug;
  if (typeof slug === 'string' && slug.trim()) {
    return normalizeListingDetailRouteParam(slug);
  }
  return null;
}

export function resolveListingDetailKind(
  params: Record<string, string | string[] | undefined> | null | undefined,
): ListingDetailKind {
  if (params && typeof params.slug === 'string' && params.slug.trim()) {
    return 'request';
  }
  return 'product';
}

/** Relative API path — always uses resolved UUID, not full SEO slug. */
export function listingDetailApiPath(routeParam: string): string {
  const normalized = normalizeListingDetailRouteParam(routeParam);
  const id = resolveListingIdFromParam(normalized);
  return `/api/products/${encodeURIComponent(id)}`;
}

/** Absolute fetch URL for client (handles Capacitor / localhost origins). */
export function listingDetailFetchUrl(routeParam: string): string {
  return resolveClientApiUrl(listingDetailApiPath(routeParam));
}

export function listingDetailResolvedId(routeParam: string): string {
  return resolveListingIdFromParam(normalizeListingDetailRouteParam(routeParam));
}
