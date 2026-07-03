/**
 * Central place/coords resolution for marketplace items.
 * Never use "Nederland" as a place fallback — use null + UI unknown label.
 */

import { resolveSellerCoords, type Coords } from '@/lib/delivery/delivery-position';
import { DISTANCE_UNKNOWN_LABEL } from '@/lib/geo/local-discovery';
import { formatMarketplaceDistanceKm } from '@/lib/geo/distance-format';
import { safeDistanceKm } from '@/lib/geocoding';

export type { Coords };

export type UserPlaceInput = {
  place?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type SellerLocationInput = {
  lat?: number | null;
  lng?: number | null;
  User?: UserPlaceInput | null;
};

export type ProductLocationInput = {
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  seller?: SellerLocationInput | null;
};

const COUNTRY_PLACE_BLOCKLIST = new Set(
  ['nederland', 'netherlands', 'nl', 'the netherlands'].map((s) => s.toLowerCase())
);

function isValidCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function normalizePlacePart(value: string | null | undefined): string | null {
  const t = value?.trim();
  if (!t) return null;
  if (COUNTRY_PLACE_BLOCKLIST.has(t.toLowerCase())) return null;
  return t;
}

/** First segment before comma (city/neighborhood label). */
export function firstPlaceSegment(value: string | null | undefined): string | null {
  const raw = normalizePlacePart(value);
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  return first ? normalizePlacePart(first) : null;
}

/** Extract a human place label from a pickup address string. */
export function placeFromPickupAddress(
  pickupAddress: string | null | undefined
): string | null {
  const raw = pickupAddress?.trim();
  if (!raw) return null;
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return normalizePlacePart(last) ?? normalizePlacePart(parts[0]);
}

export { resolveSellerCoords };

/** Product coords: pickup first, then seller profile / user fallback. */
export function resolveProductCoords(
  product: ProductLocationInput | null | undefined
): Coords | null {
  if (!product) return null;
  if (isValidCoord(product.pickupLat) && isValidCoord(product.pickupLng)) {
    return { lat: product.pickupLat, lng: product.pickupLng };
  }
  return resolveSellerCoords(product.seller ?? null);
}

/** @deprecated Use resolveProductCoords — kept for listings without pickup. */
export function resolveMarketplaceItemCoordsFromSeller(
  seller: SellerLocationInput | null | undefined
): Coords | null {
  return resolveSellerCoords(seller);
}

export function resolveItemPlaceLabel(input: {
  pickupAddress?: string | null;
  place?: string | null;
  city?: string | null;
  user?: UserPlaceInput | null;
}): string | null {
  const fromPickup = placeFromPickupAddress(input.pickupAddress);
  if (fromPickup) return fromPickup;

  const fromPlace = firstPlaceSegment(input.place ?? input.user?.place);
  if (fromPlace) return fromPlace;

  const fromCity = firstPlaceSegment(input.city ?? input.user?.city);
  if (fromCity) return fromCity;

  return null;
}

/** Display label for feed/cards — never returns "Nederland". */
export function resolveDisplayPlace(
  label: string | null | undefined,
  unknownLabel: string = DISTANCE_UNKNOWN_LABEL
): string {
  const normalized = firstPlaceSegment(label);
  return normalized ?? unknownLabel;
}

export function resolveProductPlaceLabel(
  product: ProductLocationInput & {
    seller?: (SellerLocationInput & { User?: UserPlaceInput | null }) | null;
  }
): string | null {
  return resolveItemPlaceLabel({
    pickupAddress: product.pickupAddress,
    user: product.seller?.User ?? null,
    place: product.seller?.User?.place,
    city: product.seller?.User?.city,
  });
}

export function resolveListingPlaceLabel(listing: {
  place?: string | null;
  User?: UserPlaceInput | null;
}): string | null {
  return resolveItemPlaceLabel({
    place: listing.place,
    user: listing.User ?? null,
    city: listing.User?.city,
  });
}

export function resolveDishPlaceLabel(dish: {
  place?: string | null;
  user?: UserPlaceInput | null;
}): string | null {
  return resolveItemPlaceLabel({
    place: dish.place,
    user: dish.user ?? null,
    city: dish.user?.city,
  });
}

export function resolveListingCoords(listing: {
  lat?: number | null;
  lng?: number | null;
  User?: UserPlaceInput | null;
}): Coords | null {
  if (isValidCoord(listing.lat) && isValidCoord(listing.lng)) {
    return { lat: listing.lat, lng: listing.lng };
  }
  const u = listing.User;
  if (u && isValidCoord(u.lat) && isValidCoord(u.lng)) {
    return { lat: u.lat, lng: u.lng };
  }
  return null;
}

export function resolveDishCoords(dish: {
  lat?: number | null;
  lng?: number | null;
  user?: UserPlaceInput | null;
}): Coords | null {
  if (isValidCoord(dish.lat) && isValidCoord(dish.lng)) {
    return { lat: dish.lat, lng: dish.lng };
  }
  const u = dish.user;
  if (u && isValidCoord(u.lat) && isValidCoord(u.lng)) {
    return { lat: u.lat, lng: u.lng };
  }
  return null;
}

function isUsableDistanceKm(km: unknown): km is number {
  return typeof km === 'number' && Number.isFinite(km) && km > 0 && km !== Infinity;
}

/** Coords from /api/feed item payload — pickup → seller profile → user. */
export function resolveFeedItemCoordsFromRaw(
  raw: Record<string, unknown> | null | undefined
): Coords | null {
  if (!raw) return null;

  const pickupLat = raw.pickupLat != null ? Number(raw.pickupLat) : NaN;
  const pickupLng = raw.pickupLng != null ? Number(raw.pickupLng) : NaN;
  if (Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
    return { lat: pickupLat, lng: pickupLng };
  }

  const seller = raw.seller as SellerLocationInput | undefined;
  const fromSeller = resolveProductCoords({
    pickupLat: null,
    pickupLng: null,
    seller: seller ?? null,
  });
  if (fromSeller) return fromSeller;

  const user = raw.User as UserPlaceInput | undefined;
  if (
    user?.lat != null &&
    user?.lng != null &&
    Number.isFinite(user.lat) &&
    Number.isFinite(user.lng)
  ) {
    return { lat: user.lat, lng: user.lng };
  }

  const loc = raw.location as { lat?: number | null; lng?: number | null } | undefined;
  if (
    loc?.lat != null &&
    loc?.lng != null &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng)
  ) {
    return { lat: loc.lat, lng: loc.lng };
  }

  const flatLat = raw.lat != null ? Number(raw.lat) : NaN;
  const flatLng = raw.lng != null ? Number(raw.lng) : NaN;
  if (Number.isFinite(flatLat) && Number.isFinite(flatLng)) {
    return { lat: flatLat, lng: flatLng };
  }

  return null;
}

/** Distance from viewer to item coords (km, 1 decimal). Returns undefined when not computable. */
export function computeViewerDistanceKm(
  viewer: Coords | null | undefined,
  itemLat: number | null | undefined,
  itemLng: number | null | undefined,
): number | undefined {
  if (!viewer || itemLat == null || itemLng == null) return undefined;
  if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return undefined;
  const km = safeDistanceKm(viewer.lat, viewer.lng, itemLat, itemLng);
  if (km == null || !Number.isFinite(km) || km <= 0) return undefined;
  return Math.round(km * 10) / 10;
}

export { formatMarketplaceDistanceKm, formatMarketplaceDistanceLabel } from '@/lib/geo/distance-format';

/**
 * Consistent feed card location line:
 * - place + distance → "Plaats · 3.2 km"
 * - place only → "Plaats" (no "afstand onbekend" on cards)
 * - distance only → "Locatie onbekend · 3.2 km"
 * - neither → "Locatie onbekend"
 */
export function formatItemPlaceDistanceLine(input: {
  place?: string | null;
  distanceKm?: number | null;
  unknownPlaceLabel: string;
  /** Reserved for filters/detail UI — not appended when place is known. */
  unknownDistanceLabel: string;
}): string {
  const unknownPlace = input.unknownPlaceLabel;
  const placeLabel = resolveDisplayPlace(input.place, unknownPlace);
  const hasPlace = placeLabel !== unknownPlace;
  const hasDistance = isUsableDistanceKm(input.distanceKm);
  const distanceStr = hasDistance ? formatMarketplaceDistanceKm(input.distanceKm!) : null;

  if (hasPlace && hasDistance) return `${placeLabel} · ${distanceStr}`;
  if (hasPlace && !hasDistance) return placeLabel;
  if (!hasPlace && hasDistance) return `${unknownPlace} · ${distanceStr}`;
  return unknownPlace;
}
