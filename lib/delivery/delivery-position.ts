/** Max age for live GPS before fallback (15 minutes). */
export const DELIVERY_GPS_MAX_AGE_MS = 15 * 60 * 1000;

export type Coords = { lat: number; lng: number };

export type DelivererPositionSource = 'gps' | 'home' | 'profile';

export type DelivererPosition = Coords & {
  source: DelivererPositionSource;
};

export type DelivererPositionInput = {
  gpsTrackingEnabled: boolean;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  lastGpsUpdate: Date | null;
  homeLat: number | null;
  homeLng: number | null;
  user?: { lat: number | null; lng: number | null } | null;
};

export type SellerCoordsInput = {
  lat?: number | null;
  lng?: number | null;
  User?: { lat?: number | null; lng?: number | null } | null;
};

/**
 * Seller anchor: SellerProfile.lat/lng, fallback User.lat/lng (checkout/webhook legacy).
 */
export function resolveSellerCoords(
  seller: SellerCoordsInput | null | undefined
): Coords | null {
  if (!seller) return null;
  const lat = seller.lat ?? seller.User?.lat;
  const lng = seller.lng ?? seller.User?.lng;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  return { lat, lng };
}

function isGpsFresh(lastGpsUpdate: Date | null, nowMs = Date.now()): boolean {
  if (!lastGpsUpdate) return false;
  return nowMs - new Date(lastGpsUpdate).getTime() <= DELIVERY_GPS_MAX_AGE_MS;
}

/**
 * Deliverer position for matching:
 * fresh GPS → homeLat/lng → User.lat/lng.
 */
export function resolveDelivererPosition(
  profile: DelivererPositionInput,
  nowMs = Date.now()
): DelivererPosition | null {
  const gpsFresh = isGpsFresh(profile.lastGpsUpdate, nowMs);

  if (
    profile.gpsTrackingEnabled &&
    profile.isOnline &&
    profile.currentLat != null &&
    profile.currentLng != null &&
    gpsFresh
  ) {
    return {
      lat: profile.currentLat,
      lng: profile.currentLng,
      source: 'gps',
    };
  }

  if (
    profile.homeLat != null &&
    profile.homeLng != null &&
    Number.isFinite(profile.homeLat) &&
    Number.isFinite(profile.homeLng)
  ) {
    return {
      lat: profile.homeLat,
      lng: profile.homeLng,
      source: 'home',
    };
  }

  if (
    profile.user?.lat != null &&
    profile.user?.lng != null &&
    Number.isFinite(profile.user.lat) &&
    Number.isFinite(profile.user.lng)
  ) {
    return {
      lat: profile.user.lat,
      lng: profile.user.lng,
      source: 'profile',
    };
  }

  return null;
}
