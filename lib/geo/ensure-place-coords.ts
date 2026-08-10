/**
 * Server write-time helper: fill missing listing/profile coords from place text.
 * Never call from feed/read paths.
 */
import {
  resolvePlaceInput,
  type ResolvedPlaceCandidate,
  type ResolvePlaceInputResult,
} from '@/lib/geo/resolve-place-input';

function isUsableCoord(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export type EnsurePlaceCoordsResult = {
  lat: number | null;
  lng: number | null;
  resolution: ResolvePlaceInputResult | null;
  /** True when server filled coords from geocoder. */
  filledFromGeocode: boolean;
};

/**
 * If coords already usable, keep them.
 * If missing and place query present, attempt controlled resolution.
 * Ambiguous → does not guess (lat/lng stay null; caller returns 400 with candidates).
 */
export async function ensureCoordsFromPlaceQuery(opts: {
  placeQuery: string | null | undefined;
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** When true, skip geocode even if coords missing (caller handles). */
  skip?: boolean;
}): Promise<EnsurePlaceCoordsResult> {
  const lat = opts.lat ?? null;
  const lng = opts.lng ?? null;
  if (opts.skip) {
    return { lat, lng, resolution: null, filledFromGeocode: false };
  }
  if (isUsableCoord(lat, lng)) {
    return { lat, lng, resolution: null, filledFromGeocode: false };
  }

  const query = typeof opts.placeQuery === 'string' ? opts.placeQuery.trim() : '';
  if (query.length < 2) {
    return { lat: null, lng: null, resolution: null, filledFromGeocode: false };
  }

  const resolution = await resolvePlaceInput({
    query,
    countryCode: opts.countryCode || 'NL',
  });

  if (resolution.status === 'resolved') {
    return {
      lat: resolution.result.lat,
      lng: resolution.result.lng,
      resolution,
      filledFromGeocode: true,
    };
  }

  return {
    lat: null,
    lng: null,
    resolution,
    filledFromGeocode: false,
  };
}

export function ambiguousLocationResponse(candidates: ResolvedPlaceCandidate[]) {
  return {
    error: 'Welke locatie bedoel je? Kies een van de opties.',
    code: 'location_ambiguous' as const,
    candidates: candidates.map((c) => ({
      label: c.label,
      lat: c.lat,
      lng: c.lng,
      city: c.city,
      countryCode: c.countryCode,
    })),
  };
}
