/**
 * Nearby product integrity — location readiness for "In je buurt".
 *
 * Missing GPS must never blank the marketplace. Soft national / IP approx
 * keep listings visible; a non-blocking banner invites refinement.
 */

export const NEARBY_LOCATION_STATUS = {
  GPS_GRANTED: 'GPS_GRANTED',
  GPS_DENIED: 'GPS_DENIED',
  GPS_UNAVAILABLE: 'GPS_UNAVAILABLE',
  GPS_TIMEOUT: 'GPS_TIMEOUT',
  NO_LOCATION_SELECTED: 'NO_LOCATION_SELECTED',
  LOCATION_READY: 'LOCATION_READY',
  NEARBY_EMPTY_STATE: 'NEARBY_EMPTY_STATE',
  NEARBY_RESULTS: 'NEARBY_RESULTS',
} as const;

export type NearbyLocationStatus =
  (typeof NEARBY_LOCATION_STATUS)[keyof typeof NEARBY_LOCATION_STATUS];

export function nearbyHasValidViewerLocation(input: {
  appliedPlace?: string | null;
  feedCoords?: { lat: number; lng: number } | null;
  /** Phase 5.6 — country/region boundary mode counts as located. */
  countryCode?: string | null;
  locationMode?: string | null;
}): boolean {
  if (input.appliedPlace?.trim()) return true;
  if (
    input.countryCode?.trim() &&
    (input.locationMode === 'country' ||
      input.locationMode === 'region' ||
      !input.locationMode)
  ) {
    // countryCode alone is enough for boundary mode; point mode still needs coords/place
    if (input.locationMode === 'country' || input.locationMode === 'region') {
      return true;
    }
  }
  if (input.locationMode === 'country' || input.locationMode === 'region') {
    return Boolean(input.countryCode?.trim());
  }
  const c = input.feedCoords;
  if (
    c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng)
  ) {
    return true;
  }
  return false;
}

/** Client/API: Nearby selected but no place, coords, or country boundary. */
export function isNearbyMissingLocation(input: {
  scope: string;
  appliedPlace?: string | null;
  feedCoords?: { lat: number; lng: number } | null;
  countryCode?: string | null;
  locationMode?: string | null;
}): boolean {
  if (input.scope !== 'nearby') return false;
  return !nearbyHasValidViewerLocation(input);
}

export function mapGpsFailureToNearbyStatus(
  code: string | null | undefined,
): NearbyLocationStatus {
  const c = (code || '').toUpperCase();
  if (
    c === 'DENIED' ||
    c === 'PERMISSION_DENIED' ||
    c === 'GPS_DENIED'
  ) {
    return NEARBY_LOCATION_STATUS.GPS_DENIED;
  }
  if (c === 'TIMEOUT' || c === 'GPS_TIMEOUT') {
    return NEARBY_LOCATION_STATUS.GPS_TIMEOUT;
  }
  if (
    c === 'UNAVAILABLE' ||
    c === 'POSITION_UNAVAILABLE' ||
    c === 'NOT_NATIVE' ||
    c === 'GPS_UNAVAILABLE'
  ) {
    return NEARBY_LOCATION_STATUS.GPS_UNAVAILABLE;
  }
  return NEARBY_LOCATION_STATUS.GPS_UNAVAILABLE;
}
