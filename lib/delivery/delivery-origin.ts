/**
 * HomeCheff delivery origin (V12).
 * A courier is matched from the sales location where the product is picked up.
 * Products without sales-location links keep the legacy listing/profile coordinates.
 * This does not split stock and does not invent a second pricing formula.
 */
import { haversineKm } from '@/lib/community/geoDistance';

export type DeliveryOriginStall = {
  locationId: string;
  name: string;
  city: string;
  addressLabel: string;
  lat: number;
  lng: number;
  isPrimary: boolean;
};

export type DeliveryOriginChoice = {
  locationId: string;
  name: string;
  city: string;
  addressLabel: string;
  lat: number;
  lng: number;
};

export type DeliveryOriginDecision =
  | { ok: true; kind: 'legacy' }
  | {
      ok: true;
      kind: 'location';
      reason: 'requested' | 'only' | 'nearest' | 'primary';
      location: DeliveryOriginChoice;
      alternatives: DeliveryOriginChoice[];
    }
  | {
      ok: false;
      code: 'LOCATION_NOT_ON_PRODUCT' | 'NO_SHARED_LOCATION' | 'LOCATION_WITHOUT_COORDINATES';
    };

const LOCATION_ID = /salesLocationId=([0-9a-f-]{36})/i;

export function deliveryModeUsesSalesOrigin(mode: string | null | undefined): boolean {
  const value = (mode || '').trim().toUpperCase();
  return (
    value === 'LOCAL_DELIVERY' ||
    value === 'DELIVERY' ||
    value === 'TEEN_DELIVERY' ||
    value === 'LOCAL_PROVIDER'
  );
}

export function readSalesLocationId(notes: string | null | undefined): string | null {
  const match = notes?.match(LOCATION_ID);
  return match?.[1] ?? null;
}

export function withSalesLocationNote(
  notes: string | null | undefined,
  locationId: string | null | undefined,
): string | null {
  const stripped = (notes ?? '')
    .replace(/(?:^|\n)salesLocationId=[0-9a-f-]{36}(?=\n|$)/gi, '')
    .trim();
  if (!locationId) return stripped || null;
  return [`salesLocationId=${locationId}`, stripped].filter(Boolean).join('\n');
}

function present(stall: DeliveryOriginStall): DeliveryOriginChoice {
  return {
    locationId: stall.locationId,
    name: stall.name,
    city: stall.city,
    addressLabel: stall.addressLabel,
    lat: stall.lat,
    lng: stall.lng,
  };
}

function unique(stalls: DeliveryOriginStall[]): DeliveryOriginStall[] {
  const seen = new Set<string>();
  const rows: DeliveryOriginStall[] = [];
  for (const stall of stalls) {
    if (seen.has(stall.locationId)) continue;
    if (!Number.isFinite(stall.lat) || !Number.isFinite(stall.lng)) continue;
    seen.add(stall.locationId);
    rows.push(stall);
  }
  return rows;
}

function shared(perProduct: DeliveryOriginStall[][]): DeliveryOriginStall[] {
  const lists = perProduct.map(unique);
  const [first, ...rest] = lists;
  if (!first) return [];
  return first.filter((stall) =>
    rest.every((list) => list.some((other) => other.locationId === stall.locationId)),
  );
}

function byDistance(stalls: DeliveryOriginStall[], lat: number, lng: number): DeliveryOriginStall[] {
  return [...stalls].sort((a, b) => {
    const delta = haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng);
    if (delta !== 0) return delta;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * One stall that is valid for every product in the delivery.
 * An explicit request is never replaced by a nearer stall.
 * An empty link list on every product means the legacy pickup coordinates stay in force.
 */
export function selectSharedDeliveryOrigin(input: {
  perProduct: DeliveryOriginStall[][];
  requestedLocationId?: string | null;
  buyerLat?: number | null;
  buyerLng?: number | null;
}): DeliveryOriginDecision {
  if (input.perProduct.length === 0 || input.perProduct.every((list) => list.length === 0)) {
    return { ok: true, kind: 'legacy' };
  }
  if (input.perProduct.some((list) => list.length === 0)) {
    return { ok: false, code: 'NO_SHARED_LOCATION' };
  }

  const intersection = shared(input.perProduct);
  if (intersection.length === 0) {
    return { ok: false, code: 'NO_SHARED_LOCATION' };
  }

  const requested = input.requestedLocationId?.trim() || null;
  let chosen: DeliveryOriginStall | undefined;
  let reason: 'requested' | 'only' | 'nearest' | 'primary' = 'only';

  if (requested) {
    chosen = intersection.find((stall) => stall.locationId === requested);
    if (!chosen) {
      const knownSomewhere = input.perProduct.some((list) =>
        list.some((stall) => stall.locationId === requested),
      );
      return {
        ok: false,
        code: knownSomewhere ? 'NO_SHARED_LOCATION' : 'LOCATION_NOT_ON_PRODUCT',
      };
    }
    reason = 'requested';
  } else if (intersection.length === 1) {
    chosen = intersection[0];
    reason = 'only';
  } else if (
    typeof input.buyerLat === 'number' &&
    typeof input.buyerLng === 'number' &&
    Number.isFinite(input.buyerLat) &&
    Number.isFinite(input.buyerLng)
  ) {
    chosen = byDistance(intersection, input.buyerLat, input.buyerLng)[0];
    reason = 'nearest';
  } else {
    chosen =
      intersection.find((stall) => stall.isPrimary) ??
      [...intersection].sort((a, b) => a.name.localeCompare(b.name))[0];
    reason = 'primary';
  }

  if (!chosen) return { ok: false, code: 'LOCATION_WITHOUT_COORDINATES' };

  const ordered =
    typeof input.buyerLat === 'number' &&
    typeof input.buyerLng === 'number' &&
    Number.isFinite(input.buyerLat) &&
    Number.isFinite(input.buyerLng)
      ? byDistance(intersection, input.buyerLat, input.buyerLng)
      : [...intersection].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));

  return {
    ok: true,
    kind: 'location',
    reason,
    location: present(chosen),
    alternatives: ordered.map(present),
  };
}
