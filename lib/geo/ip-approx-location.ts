/**
 * Approximate viewer location from edge/CDN request headers (no browser permission).
 * Phase 5.6 — international: never invent NL coords for unknown/non-NL visitors.
 */

import { normalizeCountryCode } from '@/lib/gamification/country-code';

export type IpApproxLocation = {
  lat: number | null;
  lng: number | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  source: 'vercel' | 'cloudflare' | 'fallback-nl' | 'none';
  /** Browse mode hint for first-visit. */
  mode: 'point' | 'country' | 'global';
  precise: false;
};

/** Geographic center of mainland Netherlands — only when country is known NL without coords. */
export const NL_FALLBACK_COORDS = { lat: 52.1326, lng: 5.2913 } as const;

function header(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return typeof raw === 'string' ? raw : null;
}

function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function decodeMaybe(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Resolve approximate location from Vercel / Cloudflare geo headers.
 * Supports country-only (no lat/lng) → mode country.
 * Returns null only when nothing useful is present.
 */
export function resolveIpApproxLocation(
  headers: Headers | Record<string, string | string[] | undefined>,
): IpApproxLocation | null {
  const vercelLat = parseCoord(header(headers, 'x-vercel-ip-latitude'));
  const vercelLng = parseCoord(header(headers, 'x-vercel-ip-longitude'));
  const vercelCity = decodeMaybe(header(headers, 'x-vercel-ip-city'));
  const vercelRegion = header(headers, 'x-vercel-ip-country-region');
  const vercelCountry = normalizeCountryCode(header(headers, 'x-vercel-ip-country'));

  if (vercelLat != null && vercelLng != null) {
    return {
      lat: vercelLat,
      lng: vercelLng,
      city: vercelCity,
      region: vercelRegion,
      country: vercelCountry,
      countryCode: vercelCountry,
      source: 'vercel',
      mode: 'point',
      precise: false,
    };
  }

  if (vercelCountry) {
    return {
      lat: null,
      lng: null,
      city: vercelCity,
      region: vercelRegion,
      country: vercelCountry,
      countryCode: vercelCountry,
      source: 'vercel',
      mode: 'country',
      precise: false,
    };
  }

  const cfLat = parseCoord(header(headers, 'cf-iplatitude'));
  const cfLng = parseCoord(header(headers, 'cf-iplongitude'));
  const cfCity = header(headers, 'cf-ipcity');
  const cfRegion = header(headers, 'cf-region');
  const cfCountry = normalizeCountryCode(header(headers, 'cf-ipcountry'));

  if (cfLat != null && cfLng != null) {
    return {
      lat: cfLat,
      lng: cfLng,
      city: cfCity,
      region: cfRegion,
      country: cfCountry,
      countryCode: cfCountry,
      source: 'cloudflare',
      mode: 'point',
      precise: false,
    };
  }

  if (cfCountry) {
    return {
      lat: null,
      lng: null,
      city: cfCity,
      region: cfRegion,
      country: cfCountry,
      countryCode: cfCountry,
      source: 'cloudflare',
      mode: 'country',
      precise: false,
    };
  }

  return null;
}

/**
 * Public JSON for /api/geo/approx.
 * Unknown geo → global (no invented NL coords).
 * NL without coords may use labeled mainland center as soft point approx.
 */
export function resolveIpApproxLocationForBrowse(
  headers: Headers | Record<string, string | string[] | undefined>,
): IpApproxLocation {
  const resolved = resolveIpApproxLocation(headers);
  if (resolved) {
    if (
      resolved.countryCode === 'NL' &&
      resolved.lat == null &&
      resolved.lng == null
    ) {
      return {
        ...resolved,
        lat: NL_FALLBACK_COORDS.lat,
        lng: NL_FALLBACK_COORDS.lng,
        mode: 'point',
        source: resolved.source,
      };
    }
    return resolved;
  }
  return {
    lat: null,
    lng: null,
    city: null,
    region: null,
    country: null,
    countryCode: null,
    source: 'none',
    mode: 'global',
    precise: false,
  };
}

/**
 * @deprecated Prefer resolveIpApproxLocationForBrowse — NL invent only when unlabeled.
 * Kept for legacy callers that require always-defined coords.
 */
export function resolveIpApproxLocationOrNlFallback(
  headers: Headers | Record<string, string | string[] | undefined>,
): IpApproxLocation & { lat: number; lng: number } {
  const browse = resolveIpApproxLocationForBrowse(headers);
  if (browse.lat != null && browse.lng != null) {
    return { ...browse, lat: browse.lat, lng: browse.lng };
  }
  return {
    lat: NL_FALLBACK_COORDS.lat,
    lng: NL_FALLBACK_COORDS.lng,
    city: null,
    region: null,
    country: 'NL',
    countryCode: 'NL',
    source: 'fallback-nl',
    mode: 'point',
    precise: false,
  };
}
