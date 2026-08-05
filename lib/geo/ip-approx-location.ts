/**
 * Approximate viewer location from edge/CDN request headers (no browser permission).
 * Used for first-visit feed relevance — never blocks discovery.
 */

export type IpApproxLocation = {
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
  source: 'vercel' | 'cloudflare' | 'fallback-nl';
};

/** Geographic center of mainland Netherlands — last-resort coords only. */
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

/**
 * Resolve approximate location from Vercel / Cloudflare geo headers.
 * Returns null when no usable coords (caller may fall back to national feed).
 */
export function resolveIpApproxLocation(
  headers: Headers | Record<string, string | string[] | undefined>,
): IpApproxLocation | null {
  const vercelLat = parseCoord(header(headers, 'x-vercel-ip-latitude'));
  const vercelLng = parseCoord(header(headers, 'x-vercel-ip-longitude'));
  const vercelCity = header(headers, 'x-vercel-ip-city');
  const vercelRegion = header(headers, 'x-vercel-ip-country-region');
  const vercelCountry = header(headers, 'x-vercel-ip-country');

  if (vercelLat != null && vercelLng != null) {
    return {
      lat: vercelLat,
      lng: vercelLng,
      city: vercelCity ? decodeURIComponent(vercelCity) : null,
      region: vercelRegion,
      country: vercelCountry,
      source: 'vercel',
    };
  }

  const cfLat = parseCoord(header(headers, 'cf-iplatitude'));
  const cfLng = parseCoord(header(headers, 'cf-iplongitude'));
  const cfCity = header(headers, 'cf-ipcity');
  const cfRegion = header(headers, 'cf-region');
  const cfCountry = header(headers, 'cf-ipcountry');

  if (cfLat != null && cfLng != null) {
    return {
      lat: cfLat,
      lng: cfLng,
      city: cfCity,
      region: cfRegion,
      country: cfCountry,
      source: 'cloudflare',
    };
  }

  return null;
}

/** Public JSON for /api/geo/approx — includes NL fallback when headers missing. */
export function resolveIpApproxLocationOrNlFallback(
  headers: Headers | Record<string, string | string[] | undefined>,
): IpApproxLocation {
  const resolved = resolveIpApproxLocation(headers);
  if (resolved) return resolved;
  return {
    lat: NL_FALLBACK_COORDS.lat,
    lng: NL_FALLBACK_COORDS.lng,
    city: null,
    region: null,
    country: 'NL',
    source: 'fallback-nl',
  };
}
