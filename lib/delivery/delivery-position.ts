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

export type DeliveryPickupProductInput = {
  pickupLat?: number | null;
  pickupLng?: number | null;
  seller?: SellerCoordsInput | null;
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

/**
 * Contractual delivery pickup: listing pickup coords → SellerProfile → User.
 * Must be used by match-deliverers, fee, checkout, and booking (not browse location).
 */
export function resolveDeliveryPickupCoords(
  product: DeliveryPickupProductInput | null | undefined
): Coords | null {
  if (!product) return null;
  if (
    product.pickupLat != null &&
    product.pickupLng != null &&
    Number.isFinite(product.pickupLat) &&
    Number.isFinite(product.pickupLng)
  ) {
    return { lat: product.pickupLat, lng: product.pickupLng };
  }
  return resolveSellerCoords(product.seller ?? null);
}

function isGpsFresh(lastGpsUpdate: Date | null, nowMs = Date.now()): boolean {
  if (!lastGpsUpdate) return false;
  return nowMs - new Date(lastGpsUpdate).getTime() <= DELIVERY_GPS_MAX_AGE_MS;
}

/** What the open dashboard may show. Coordinates stay on the server. */
export function activeOriginStatus(
  profile: DelivererPositionInput,
  nowMs = Date.now(),
): { active: 'gps' | 'home'; gpsExpiresAt: string | null } {
  const position = resolveDelivererPosition(profile, nowMs);
  if (position?.source !== 'gps' || !profile.lastGpsUpdate) {
    return { active: 'home', gpsExpiresAt: null };
  }
  return {
    active: 'gps',
    gpsExpiresAt: new Date(new Date(profile.lastGpsUpdate).getTime() + DELIVERY_GPS_MAX_AGE_MS).toISOString(),
  };
}

/**
 * Deliverer position for matching:
 * fresh GPS → homeLat/lng → User.lat/lng.
 * A later planned pickup passes immediate: false and skips today's GPS.
 */
export function resolveDelivererPosition(
  profile: DelivererPositionInput,
  nowMs = Date.now(),
  options: { immediate?: boolean } = {},
): DelivererPosition | null {
  const gpsFresh = isGpsFresh(profile.lastGpsUpdate, nowMs);
  const allowLiveGps = options.immediate !== false;

  if (
    allowLiveGps &&
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

/**
 * Direct orders use the pickup radius around the active origin.
 * A later planned pickup uses the saved home, never today's GPS fix.
 * maxTransportKm is the pickup-to-dropoff route, not the distance from the courier to the buyer.
 */
export function directOrderReach(input: {
  activeSource: DelivererPositionSource | null;
  distanceFromActiveKm: number | null;
  distanceFromHomeKm: number | null;
  routeKm: number | null;
  pickupRadiusKm: number;
  maxTransportKm: number;
  nationalCoverage?: boolean;
}): { direct: boolean; planned: boolean } {
  if (input.nationalCoverage) {
    const hasOrigin = input.distanceFromActiveKm != null || input.distanceFromHomeKm != null;
    return { direct: hasOrigin, planned: hasOrigin };
  }
  if (input.routeKm != null && input.routeKm > input.maxTransportKm) {
    return { direct: false, planned: false };
  }
  const within = (km: number | null) => km != null && km <= input.pickupRadiusKm;
  const homeOk = within(input.distanceFromHomeKm);
  const activeOk = within(input.distanceFromActiveKm);
  return {
    direct: input.activeSource === 'gps' ? activeOk : homeOk,
    planned: homeOk,
  };
}
