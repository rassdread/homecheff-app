/**
 * Multi-location V1 — pure rules.
 * One product row, many pickup points. Stock stays on Product.
 * Locations never rewrite orders or delivery pickup coordinates.
 */

import { haversineKm } from '@/lib/community/geoDistance';
import {
  getBusinessVisibilityProfile,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';

export const SALES_LOCATION_V1_STOCK = 'SHARED_PRODUCT_STOCK' as const;

/** V1 does not split stock per stall. */
export function salesLocationAssignmentChangesStock(): boolean {
  return false;
}

export type SalesLocationDraft = {
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
};

export type FeedSalesPoint = {
  locationId: string;
  lat: number;
  lng: number;
  city: string | null;
  isPrimary: boolean;
};

export type PublicPickupLocation = {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
  isActive: boolean;
  addressLabel: string;
};

const UPGRADE_HREF = '/sell';

export function salesLocationLimitForPlan(plan: BusinessPlanId): number {
  return getBusinessVisibilityProfile(plan).maxLocations;
}

export function locationLimitDecision(
  activeCount: number,
  maxLocations: number,
): { allowed: boolean; code?: 'LOCATION_LIMIT'; upgradeHref?: string } {
  if (activeCount < maxLocations) return { allowed: true };
  return { allowed: false, code: 'LOCATION_LIMIT', upgradeHref: UPGRADE_HREF };
}

/**
 * Downgrade and expiry do not delete stored stalls, products, or orders.
 * Only this many active stalls stay selectable and public: primary first, then oldest.
 */
export const DOWNGRADE_KEEPS_STORED_LOCATIONS = true;

export function entitledActiveLocationIds(
  locations: Array<{
    id: string;
    isActive: boolean;
    isPrimary: boolean;
    createdAt: Date | string;
  }>,
  maxLocations: number,
): string[] {
  const active = locations.filter((row) => row.isActive);
  active.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  return active.slice(0, Math.max(0, maxLocations)).map((row) => row.id);
}

export function actorOwnsLocation(
  locationUserId: string | null | undefined,
  actorUserId: string | null | undefined,
): boolean {
  if (!locationUserId || !actorUserId) return false;
  return locationUserId === actorUserId;
}

export function parseSalesLocationDraft(
  body: unknown,
): { ok: true; value: SalesLocationDraft } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Ongeldige locatie.' };
  }
  const raw = body as Record<string, unknown>;
  const name = String(raw.name ?? '').trim();
  const street = String(raw.street ?? '').trim();
  const houseNumber = String(raw.houseNumber ?? '').trim();
  const postalCode = String(raw.postalCode ?? '').trim();
  const city = String(raw.city ?? '').trim();
  const country = (String(raw.country ?? 'NL').trim() || 'NL').toUpperCase();
  if (!name || name.length > 80) {
    return { ok: false, error: 'Vul een locatienaam in (maximaal 80 tekens).' };
  }
  if (!street || !houseNumber || !postalCode || !city) {
    return { ok: false, error: 'Vul straat, huisnummer, postcode en plaats in.' };
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    return { ok: false, error: 'Gebruik een landcode van twee letters, bijvoorbeeld NL.' };
  }
  return {
    ok: true,
    value: { name, street, houseNumber, postalCode, city, country },
  };
}

export function parseSalesLocationIdList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of input) {
    const id = String(value ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function formatSalesLocationAddress(input: {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country?: string | null;
}): string {
  const streetLine = [input.street, input.houseNumber].filter(Boolean).join(' ').trim();
  const cityLine = [input.postalCode, input.city].filter(Boolean).join(' ').trim();
  const country =
    input.country && input.country.toUpperCase() !== 'NL' ? input.country.toUpperCase() : null;
  return [streetLine, cityLine, country].filter(Boolean).join(', ');
}

export function toPublicPickupLocation(input: {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
  isActive: boolean;
}): PublicPickupLocation {
  return {
    ...input,
    addressLabel: formatSalesLocationAddress(input),
  };
}

export function primaryIdAfterDeactivate(
  locations: Array<{ id: string; isPrimary: boolean; isActive: boolean }>,
  deactivatedId: string,
): string | null {
  const remaining = locations.filter((row) => row.id !== deactivatedId && row.isActive);
  if (remaining.some((row) => row.isPrimary)) return null;
  return remaining[0]?.id ?? null;
}

export function activeFeedPoints(
  locations: Array<{
    id: string;
    lat: number | null;
    lng: number | null;
    city: string | null;
    isActive: boolean;
    isPrimary: boolean;
  }>,
): FeedSalesPoint[] {
  const active = locations.filter(
    (row) =>
      row.isActive &&
      row.lat != null &&
      row.lng != null &&
      Number.isFinite(row.lat) &&
      Number.isFinite(row.lng),
  );
  const ordered = [
    ...active.filter((row) => row.isPrimary),
    ...active.filter((row) => !row.isPrimary),
  ];
  return ordered.map((row) => ({
    locationId: row.id,
    lat: row.lat as number,
    lng: row.lng as number,
    city: row.city,
    isPrimary: row.isPrimary,
  }));
}

export function nearestFeedSalesPoint(
  points: FeedSalesPoint[],
  viewer: { lat: number; lng: number } | null,
): FeedSalesPoint | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  );
  if (usable.length === 0) return null;
  if (
    !viewer ||
    !Number.isFinite(viewer.lat) ||
    !Number.isFinite(viewer.lng)
  ) {
    return usable.find((point) => point.isPrimary) ?? usable[0];
  }
  let best = usable[0];
  let bestKm = haversineKm(viewer.lat, viewer.lng, best.lat, best.lng);
  for (const point of usable.slice(1)) {
    const km = haversineKm(viewer.lat, viewer.lng, point.lat, point.lng);
    if (km < bestKm) {
      best = point;
      bestKm = km;
    }
  }
  return best;
}

export function selectFeedDisplayAnchor(input: {
  points: FeedSalesPoint[];
  viewer: { lat: number; lng: number } | null;
  legacyCoords: { lat: number; lng: number } | null;
  legacyPlace: string | null;
}): {
  lat: number | null;
  lng: number | null;
  place: string | null;
  locationId: string | null;
  distanceKm: number | null;
} {
  const nearest = nearestFeedSalesPoint(input.points, input.viewer);
  if (nearest) {
    const distanceKm =
      input.viewer &&
      Number.isFinite(input.viewer.lat) &&
      Number.isFinite(input.viewer.lng)
        ? Math.round(haversineKm(input.viewer.lat, input.viewer.lng, nearest.lat, nearest.lng) * 10) /
          10
        : null;
    return {
      lat: nearest.lat,
      lng: nearest.lng,
      place: nearest.city,
      locationId: nearest.locationId,
      distanceKm,
    };
  }
  if (
    input.legacyCoords &&
    Number.isFinite(input.legacyCoords.lat) &&
    Number.isFinite(input.legacyCoords.lng)
  ) {
    const distanceKm =
      input.viewer &&
      Number.isFinite(input.viewer.lat) &&
      Number.isFinite(input.viewer.lng)
        ? Math.round(
            haversineKm(
              input.viewer.lat,
              input.viewer.lng,
              input.legacyCoords.lat,
              input.legacyCoords.lng,
            ) * 10,
          ) / 10
        : null;
    return {
      lat: input.legacyCoords.lat,
      lng: input.legacyCoords.lng,
      place: input.legacyPlace,
      locationId: null,
      distanceKm,
    };
  }
  return {
    lat: null,
    lng: null,
    place: input.legacyPlace,
    locationId: null,
    distanceKm: null,
  };
}

export function dedupeMarketplaceRows<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function listingMatchesDiscovery(input: {
  title: string;
  query: string;
  distanceKm: number | null;
  radiusKm: number;
}): boolean {
  const query = input.query.trim().toLowerCase();
  if (query && !input.title.toLowerCase().includes(query)) return false;
  if (!(input.radiusKm > 0)) return true;
  if (input.distanceKm == null || !Number.isFinite(input.distanceKm)) return true;
  return input.distanceKm <= input.radiusKm + 0.001;
}

export function selectNewlyCreatedLocation<T extends Record<string, unknown>>(
  form: T,
  selectedIds: string[],
  locationId: string,
): { form: T; selectedIds: string[] } {
  const next = selectedIds.includes(locationId)
    ? selectedIds
    : [...selectedIds, locationId];
  return { form, selectedIds: next };
}

export function defaultPickupLocationId(
  locations: Array<{ id: string; isPrimary: boolean; isActive: boolean }>,
): string | null {
  const active = locations.filter((row) => row.isActive);
  return active.find((row) => row.isPrimary)?.id ?? active[0]?.id ?? null;
}

export function checkoutAddressForFulfillment(input: {
  deliveryMode: string;
  buyerAddress: string;
  items: Array<{ pickupLocationAddress?: string | null }>;
}): string {
  if (input.deliveryMode.trim().toLowerCase() !== 'pickup') return input.buyerAddress;
  const unique: string[] = [];
  for (const item of input.items) {
    const address = item.pickupLocationAddress?.trim();
    if (address && !unique.includes(address)) unique.push(address);
  }
  if (unique.length === 0) return input.buyerAddress;
  return unique.join(' | ');
}

export function readFeedSalesPoints(item: Record<string, unknown>): FeedSalesPoint[] {
  const raw = item.salesLocationPoints;
  if (!Array.isArray(raw)) return [];
  const points: FeedSalesPoint[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({
      locationId: String(row.locationId ?? ''),
      lat,
      lng,
      city: typeof row.city === 'string' ? row.city : null,
      isPrimary: row.isPrimary === true,
    });
  }
  return points;
}

/** Krentenbol fixture id used by the Demy regression. Never written to production. */
export const DEMY_KRENTENBOL_PRODUCT_ID = '81dee35b-5577-442c-a96f-13839cec8c76';
