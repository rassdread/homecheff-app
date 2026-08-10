/**
 * Write-time place → coordinates resolution.
 * Used by create/edit/profile — NEVER by feed/card render.
 *
 * Status:
 * - resolved: single high-confidence match (auto-accept OK)
 * - ambiguous: multiple distinct matches — UI must confirm
 * - none: zero usable results
 * - error: provider/timeout/invalid
 */
import { haversineKm } from '@/lib/community/geoDistance';
import {
  buildGeocodeQueryString,
  normalizePlaceQueryForGeocode,
  type GeocodeResult,
} from '@/lib/global-geocoding';

export type ResolvedPlaceCandidate = {
  label: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  countryCode?: string;
  placeId?: string;
  source: string;
};

export type ResolvePlaceInputResult =
  | {
      status: 'resolved';
      result: ResolvedPlaceCandidate;
    }
  | {
      status: 'ambiguous';
      candidates: ResolvedPlaceCandidate[];
      message: string;
    }
  | {
      status: 'none';
      message: string;
    }
  | {
      status: 'error';
      message: string;
    };

const AMBIGUITY_SEPARATION_KM = 25;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<
  string,
  { at: number; value: ResolvePlaceInputResult }
>();

/** Places that must never be auto-accepted (Kingdom NL / overseas vs gemeente). */
const ALWAYS_CONFIRM_PLACES_NL = new Set([
  'sint maarten',
  'sint-maarten',
  'st maarten',
  'st. maarten',
  'saint martin',
  'saint-martin',
]);

/** Rough metropolitan Netherlands bbox (excludes Caribbean constituent countries). */
export function isMetropolitanNetherlands(lat: number, lng: number): boolean {
  return lat >= 50.5 && lat <= 53.7 && lng >= 3.05 && lng <= 7.4;
}

function normalizeAmbiguityKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function requiresManualConfirm(query: string, countryCode: string): boolean {
  if (countryCode.toUpperCase() !== 'NL') return false;
  return ALWAYS_CONFIRM_PLACES_NL.has(normalizeAmbiguityKey(query));
}

function cacheKey(query: string, countryCode: string): string {
  return `${normalizePlaceQueryForGeocode(query, countryCode).toLowerCase()}|${countryCode.toUpperCase()}`;
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function countryMatches(
  candidateCountryCode: string | undefined,
  requested: string,
): boolean {
  if (!candidateCountryCode) return true;
  return candidateCountryCode.toUpperCase() === requested.toUpperCase();
}

function parseGoogleResult(raw: any, fallbackCountry: string): ResolvedPlaceCandidate | null {
  const location = raw?.geometry?.location;
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!isValidCoord(lat, lng)) return null;

  const components = raw.address_components || [];
  const countryComponent = components.find((c: any) => c.types?.includes('country'));
  const cityComponent = components.find(
    (c: any) =>
      c.types?.includes('locality') ||
      c.types?.includes('postal_town') ||
      c.types?.includes('administrative_area_level_2'),
  );

  return {
    label: String(raw.formatted_address || cityComponent?.long_name || ''),
    lat,
    lng,
    city: cityComponent?.long_name,
    country: countryComponent?.long_name || fallbackCountry,
    countryCode: countryComponent?.short_name || fallbackCountry,
    placeId: typeof raw.place_id === 'string' ? raw.place_id : undefined,
    source: 'GoogleMaps',
  };
}

/** Collapse near-duplicate results; keep geographically distinct options. */
export function distinctPlaceCandidates(
  candidates: ResolvedPlaceCandidate[],
  separationKm = AMBIGUITY_SEPARATION_KM,
): ResolvedPlaceCandidate[] {
  const out: ResolvedPlaceCandidate[] = [];
  for (const c of candidates) {
    const near = out.find(
      (o) => haversineKm(o.lat, o.lng, c.lat, c.lng) < separationKm,
    );
    if (!near) out.push(c);
  }
  return out;
}

async function googlePlaceCandidates(
  query: string,
  countryCode: string,
  apiKey: string,
  opts?: { restrictCountry?: boolean },
): Promise<ResolvedPlaceCandidate[]> {
  const q = normalizePlaceQueryForGeocode(query, countryCode);
  const addressQuery = buildGeocodeQueryString(q, '', countryCode);
  const region = countryCode.toLowerCase();
  const restrict = opts?.restrictCountry !== false;
  const components =
    restrict && countryCode
      ? `&components=${encodeURIComponent(`country:${countryCode.toUpperCase()}`)}`
      : '';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&region=${region}${components}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Maps API error: ${response.status}`);
  }
  const data = await response.json();
  if (data.status === 'ZERO_RESULTS' || !Array.isArray(data.results)) {
    return [];
  }
  if (data.status !== 'OK') {
    throw new Error(data.error_message || data.status || 'Geocoding failed');
  }

  return (data.results as any[])
    .map((r) => parseGoogleResult(r, countryCode))
    .filter((c): c is ResolvedPlaceCandidate => c != null)
    .filter((c) => !restrict || countryMatches(c.countryCode, countryCode))
    .slice(0, 8);
}

async function nominatimCandidates(
  query: string,
  countryCode: string,
): Promise<ResolvedPlaceCandidate[]> {
  const q = normalizePlaceQueryForGeocode(query, countryCode);
  const cc = countryCode.toLowerCase();
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=${cc}&limit=5&addressdetails=1`,
    { headers: { 'User-Agent': 'HomeCheff-App/1.0' }, next: { revalidate: 0 } },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      country?: string;
      country_code?: string;
    };
  }>;
  return data
    .map((hit) => {
      const lat = parseFloat(hit.lat);
      const lng = parseFloat(hit.lon);
      if (!isValidCoord(lat, lng)) return null;
      const hitCc = hit.address?.country_code?.toUpperCase();
      if (hitCc && !countryMatches(hitCc, countryCode)) return null;
      return {
        label: hit.display_name || q,
        lat,
        lng,
        city: hit.address?.city || hit.address?.town || hit.address?.village || q,
        country: hit.address?.country || countryCode,
        countryCode: hitCc || countryCode,
        source: 'Nominatim',
      } satisfies ResolvedPlaceCandidate;
    })
    .filter((c): c is ResolvedPlaceCandidate => c != null);
}

function preferMetropolitanNl(
  candidates: ResolvedPlaceCandidate[],
): ResolvedPlaceCandidate[] {
  const metro = candidates.filter((c) =>
    isMetropolitanNetherlands(c.lat, c.lng),
  );
  if (metro.length > 0) return metro;
  return candidates;
}

/**
 * Resolve free-text place/city/postcode/address to coordinates.
 * Country context is required to reduce global ambiguity.
 */
export async function resolvePlaceInput(opts: {
  query: string;
  countryCode?: string;
  googleMapsApiKey?: string;
  skipCache?: boolean;
}): Promise<ResolvePlaceInputResult> {
  const countryCode = (opts.countryCode || 'NL').toUpperCase();
  const raw = opts.query?.trim() || '';
  if (raw.length < 2) {
    return {
      status: 'none',
      message: 'Voer een plaats, postcode of adres in.',
    };
  }

  const key = cacheKey(raw, countryCode);
  if (!opts.skipCache) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return hit.value;
    }
  }

  let value: ResolvePlaceInputResult;
  try {
    const apiKey = opts.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    let candidates: ResolvedPlaceCandidate[] = [];
    if (apiKey) {
      candidates = await googlePlaceCandidates(raw, countryCode, apiKey);
    }
    if (candidates.length === 0) {
      candidates = await nominatimCandidates(raw, countryCode);
    } else if (
      requiresManualConfirm(raw, countryCode) ||
      candidates.length > 1
    ) {
      // Merge Nominatim only when ambiguity is plausible (avoid extra latency).
      const extra = await nominatimCandidates(raw, countryCode);
      candidates = [...candidates, ...extra];
    }

    // Known overseas/Kingdom ambiguity: also collect unrestricted hits for selection.
    if (requiresManualConfirm(raw, countryCode) && apiKey) {
      const unrestricted = await googlePlaceCandidates(raw, countryCode, apiKey, {
        restrictCountry: false,
      });
      candidates = [...candidates, ...unrestricted];
    }

    let distinct = distinctPlaceCandidates(candidates);
    if (countryCode === 'NL' && !requiresManualConfirm(raw, countryCode)) {
      distinct = preferMetropolitanNl(distinct);
    }

    if (distinct.length === 0) {
      value = {
        status: 'none',
        message: 'Locatie niet gevonden. Probeer een andere plaats of postcode.',
      };
    } else if (requiresManualConfirm(raw, countryCode)) {
      value = {
        status: 'ambiguous',
        candidates: distinct.slice(0, 5),
        message: 'Welke locatie bedoel je?',
      };
    } else if (distinct.length === 1) {
      value = { status: 'resolved', result: distinct[0] };
    } else {
      value = {
        status: 'ambiguous',
        candidates: distinct.slice(0, 5),
        message: 'Welke locatie bedoel je?',
      };
    }
  } catch (e) {
    value = {
      status: 'error',
      message:
        e instanceof Error
          ? e.message
          : 'Locatie kon tijdelijk niet worden opgezocht. Probeer het opnieuw.',
    };
  }

  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Convert legacy GeocodeResult into a candidate when valid. */
export function geocodeResultToCandidate(
  result: GeocodeResult,
): ResolvedPlaceCandidate | null {
  if (result.error || !isValidCoord(result.lat, result.lng)) return null;
  return {
    label: result.formatted_address || result.city || '',
    lat: result.lat,
    lng: result.lng,
    city: result.city,
    country: result.country,
    countryCode: result.countryCode,
    placeId: result.placeId,
    source: result.source,
  };
}

/** True when place text changed enough that previous coords must be cleared. */
export function placeTextMateriallyChanged(
  previous: string | null | undefined,
  next: string | null | undefined,
): boolean {
  const a = (previous || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const b = (next || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return a !== b;
}
