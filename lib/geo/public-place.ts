/**
 * Public Marketplace location.
 * Stored addresses and coordinates stay on the server for distance,
 * delivery and post-accept exchange. Public text is city or neighbourhood.
 */

/** Standalone token or Dutch compound ending (Hoogstraat, Kerklaan). */
const STREET_SUFFIX =
  /(?:^|[\s,])(?:straat|laan|weg|plein|singel|kade|gracht|hof|dreef|baan|steeg|pad|dijk|plantsoen|boulevard|avenue|street|road|lane|court|drive)\b|(?:straat|laan|weg|plein|singel|kade|gracht|dreef|steeg|pad|dijk)$/i;

const NL_POSTCODE = /\b\d{4}\s?[A-Za-z]{2}\b/;
const LEADING_POSTCODE = /^\d{4}(?:\s?[A-Za-z]{2})?\s+/;
const HOUSE_NUMBER = /(?:^|\s)\d{1,4}[A-Za-z]?(?:\s|$)/;

/** ~1.1 km grid — usable for maps/radius, not a doorstep. */
const APPROX_COORD_DECIMALS = 2;

export function looksLikePreciseAddress(value: string | null | undefined): boolean {
  const text = value?.trim() ?? '';
  if (!text) return false;
  if (NL_POSTCODE.test(text)) return true;
  if (STREET_SUFFIX.test(text)) return true;
  if (HOUSE_NUMBER.test(text) && /[A-Za-zÀ-ÿ]{3,}/.test(text)) return true;
  return false;
}

function cityFromSegment(segment: string): string | null {
  const stripped = segment.replace(LEADING_POSTCODE, '').replace(/\s+/g, ' ').trim();
  if (!stripped) return null;
  if (looksLikePreciseAddress(stripped)) return null;
  return stripped;
}

/** City or neighbourhood. Null when the only available text is a street or address. */
export function toPublicPlaceLabel(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const candidates = parts.length > 0 ? [...parts].reverse() : [raw];
  for (const part of candidates) {
    const city = cityFromSegment(part);
    if (city) return city;
  }
  return null;
}

function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Privacy-safe public coordinates. Exact lat/lng must stay server-side
 * for fulfillment; public maps may use this grid only.
 */
export function toApproximatePublicCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat: roundCoord(lat, APPROX_COORD_DECIMALS),
    lng: roundCoord(lng, APPROX_COORD_DECIMALS),
  };
}

export type PublicListLocation = {
  place: string | null;
  city?: string | null;
  /** Approximate only — never doorstep precision. */
  lat: number | null;
  lng: number | null;
  distanceKm?: number | null;
  salesPoints?: Array<{
    lat: number;
    lng: number;
    city: string | null;
  }>;
};

/** Allowlisted public location object for list/search APIs. */
export function toPublicListLocation(input: {
  place?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceKm?: number | null;
  salesPoints?: Array<{
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
  }>;
}): PublicListLocation {
  const approx = toApproximatePublicCoords(input.lat, input.lng);
  const salesPoints = (input.salesPoints ?? [])
    .map((point) => {
      const coords = toApproximatePublicCoords(point.lat, point.lng);
      if (!coords) return null;
      return {
        lat: coords.lat,
        lng: coords.lng,
        city: toPublicPlaceLabel(point.city),
      };
    })
    .filter((row): row is { lat: number; lng: number; city: string | null } => row != null);

  const out: PublicListLocation = {
    place: toPublicPlaceLabel(input.place),
    lat: approx?.lat ?? null,
    lng: approx?.lng ?? null,
  };
  if (input.city !== undefined) {
    out.city = toPublicPlaceLabel(input.city);
  }
  if (input.distanceKm !== undefined) {
    out.distanceKm = input.distanceKm;
  }
  if (salesPoints.length > 0) {
    out.salesPoints = salesPoints;
  }
  return out;
}

/**
 * Marketplace-visible pickup stall — never includes street, house number,
 * postcode, or exact coordinates. Owner APIs keep the full record separately.
 */
export function toMarketplacePublicPickupLocation(input: {
  id: string;
  name: string;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
  isActive: boolean;
}): {
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
} {
  const city = toPublicPlaceLabel(input.city) || toPublicPlaceLabel(input.name) || '';
  const approx = toApproximatePublicCoords(input.lat, input.lng);
  return {
    id: input.id,
    name: input.name,
    // Empty strings preserve the PublicPickupLocation shape for UI types
    // without exposing residential fields on public product pages.
    street: '',
    houseNumber: '',
    postalCode: '',
    city,
    country: input.country || 'NL',
    lat: approx?.lat ?? null,
    lng: approx?.lng ?? null,
    isPrimary: input.isPrimary,
    isActive: input.isActive,
    addressLabel: city,
  };
}

const PRECISE_KEYS = [
  'lat',
  'lng',
  'pickupLat',
  'pickupLng',
  'pickupAddress',
  'street',
  'houseNumber',
  'postalCode',
  'addressLine',
  'addressLabel',
  'deliveryAddress',
  'billingAddress',
  'shippingAddress',
  'shippingAddressSnapshot',
] as const;

function redactNestedUser(user: Record<string, unknown>): Record<string, unknown> {
  const next = { ...user };
  delete next.lat;
  delete next.lng;
  if (typeof next.place === 'string') {
    next.place = toPublicPlaceLabel(next.place);
  }
  if (typeof next.city === 'string') {
    next.city = toPublicPlaceLabel(next.city);
  }
  return next;
}

function sanitizePickupLocations(value: unknown): unknown {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const loc = row as Record<string, unknown>;
    return toMarketplacePublicPickupLocation({
      id: String(loc.id ?? ''),
      name: String(loc.name ?? ''),
      street: typeof loc.street === 'string' ? loc.street : '',
      houseNumber: typeof loc.houseNumber === 'string' ? loc.houseNumber : '',
      postalCode: typeof loc.postalCode === 'string' ? loc.postalCode : '',
      city: typeof loc.city === 'string' ? loc.city : '',
      country: typeof loc.country === 'string' ? loc.country : 'NL',
      lat: typeof loc.lat === 'number' ? loc.lat : null,
      lng: typeof loc.lng === 'number' ? loc.lng : null,
      isPrimary: Boolean(loc.isPrimary),
      isActive: loc.isActive !== false,
    });
  });
}

/**
 * Remove residence-level fields after the server has already computed distance.
 * Viewer coordinates in the request are not part of the listing payload.
 */
export function stripPreciseLocationFromPublicItem<T extends Record<string, unknown>>(
  item: T,
): T {
  const next = { ...item } as Record<string, unknown>;
  if (typeof next.place === 'string') {
    next.place = toPublicPlaceLabel(next.place);
  }
  for (const key of PRECISE_KEYS) delete next[key];
  delete next.salesLocationPoints;

  if ('pickupLocations' in next) {
    next.pickupLocations = sanitizePickupLocations(next.pickupLocations);
  }

  const location = next.location;
  if (location && typeof location === 'object') {
    const loc = { ...(location as Record<string, unknown>) };
    // Feed payloads omit coordinates entirely after distance is computed server-side.
    delete loc.lat;
    delete loc.lng;
    if (typeof loc.place === 'string') loc.place = toPublicPlaceLabel(loc.place);
    if (typeof loc.city === 'string') loc.city = toPublicPlaceLabel(loc.city);
    if (Array.isArray(loc.salesPoints)) {
      loc.salesPoints = sanitizeSalesPoints(loc.salesPoints);
    }
    next.location = loc;
  }

  const seller = next.seller;
  if (seller && typeof seller === 'object') {
    const row = { ...(seller as Record<string, unknown>) };
    delete row.lat;
    delete row.lng;
    if (row.User && typeof row.User === 'object') {
      row.User = redactNestedUser(row.User as Record<string, unknown>);
    }
    next.seller = row;
  }

  const user = next.User;
  if (user && typeof user === 'object') {
    next.User = redactNestedUser(user as Record<string, unknown>);
  }

  return next as T;
}

function sanitizeSalesPoints(points: unknown[]): Array<{
  lat: number;
  lng: number;
  city: string | null;
}> {
  const out: Array<{ lat: number; lng: number; city: string | null }> = [];
  for (const point of points) {
    if (!point || typeof point !== 'object') continue;
    const row = point as Record<string, unknown>;
    const approx = toApproximatePublicCoords(
      typeof row.lat === 'number' ? row.lat : null,
      typeof row.lng === 'number' ? row.lng : null,
    );
    if (!approx) continue;
    out.push({
      lat: approx.lat,
      lng: approx.lng,
      city: toPublicPlaceLabel(typeof row.city === 'string' ? row.city : null),
    });
  }
  return out;
}
