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

function firstRouteSegment(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0];
  }
  return null;
}

/** Strip query/hash/trailing slash from dynamic route segment. */
export function normalizeListingDetailRouteParam(param: string): string {
  let p = param;
  try {
    p = decodeURIComponent(param).trim();
  } catch {
    p = param.trim();
  }
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
  const id = firstRouteSegment(params.id);
  if (id) return normalizeListingDetailRouteParam(id);
  const slug = firstRouteSegment(params.slug);
  if (slug) return normalizeListingDetailRouteParam(slug);
  return null;
}

/** Client fallback when useParams() is empty (PWA / intercepted navigation). */
export function listingDetailRouteParamFromPathname(
  pathname: string | null | undefined,
): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/(?:product|request)\/([^/]+)\/?$/i);
  if (!match?.[1]) return null;
  return normalizeListingDetailRouteParam(match[1]);
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
