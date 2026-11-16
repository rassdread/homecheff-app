/**
 * Public Marketplace location.
 * Stored addresses and coordinates stay on the server for distance,
 * delivery and post-accept exchange. Public text is city or neighbourhood.
 */

/** Endings of Dutch and English street names, including compounds such as Molenstraat. */
const STREET_ENDINGS = [
  'straat',
  'laan',
  'weg',
  'plein',
  'singel',
  'kade',
  'gracht',
  'dreef',
  'steeg',
  'pad',
  'dijk',
  'plantsoen',
  'burgwal',
  'wal',
  'rak',
  'boulevard',
  'avenue',
  'street',
  'road',
  'lane',
  'court',
  'drive',
  'alley',
  'passage',
  'allee',
  'hof',
  'baan',
  'erf',
];

const NL_POSTCODE = /\b\d{4}\s?[A-Za-z]{2}\b/;
const LEADING_POSTCODE = /^\d{4}(?:\s?[A-Za-z]{2})?\s+/;
const HOUSE_NUMBER = /(?:^|\s)\d{1,4}[A-Za-z]?(?:\s|$)/;

function looksLikeStreetToken(token: string): boolean {
  const word = token.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
  if (!word || word === 'irak') return false;
  return STREET_ENDINGS.some((suffix) => word.endsWith(suffix) && word.length > suffix.length);
}

export function looksLikePreciseAddress(value: string | null | undefined): boolean {
  const text = value?.trim() ?? '';
  if (!text) return false;
  if (NL_POSTCODE.test(text)) return true;
  if (text.split(/[\s,.-]+/).some(looksLikeStreetToken)) return true;
  if (HOUSE_NUMBER.test(text) && /[A-Za-zÀ-ÿ]{3,}/.test(text)) return true;
  return false;
}

function cityFromSegment(segment: string): string | null {
  const stripped = segment.replace(LEADING_POSTCODE, '').replace(/\s+/g, ' ').trim();
  if (!stripped) return null;
  if (looksLikePreciseAddress(stripped)) return null;
  return stripped;
}

const LOCALITY_KINDS = new Set([
  'locality',
  'postal_town',
  'neighborhood',
  'sublocality',
  'sublocality_level_1',
]);

const STREET_KINDS = new Set([
  'route',
  'street_address',
  'premise',
  'intersection',
]);

/**
 * Outcome of the existing place resolver (resolved, ambiguous, none, error).
 * A legacy place value is public only when that source resolved one place or neighbourhood.
 */
export type PublicLocalityConfirmation =
  | { status: 'resolved'; kinds?: string[] | null; label?: string | null }
  | { status: 'ambiguous' | 'none' | 'error' };

/** Null when the resolver did not confirm a place or neighbourhood. */
export function confirmedPublicLocality(
  raw: string | null | undefined,
  confirmation: PublicLocalityConfirmation | null | undefined,
): string | null {
  if (!confirmation || confirmation.status !== 'resolved') return null;
  const kinds = confirmation.kinds ?? [];
  if (kinds.length === 0) return null;
  if (kinds.some((kind) => STREET_KINDS.has(kind))) return null;
  if (!kinds.some((kind) => LOCALITY_KINDS.has(kind))) return null;
  return toPublicPlaceLabel(confirmation.label ?? raw);
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

const PRECISE_KEYS = [
  'lat',
  'lng',
  'pickupLat',
  'pickupLng',
  'pickupAddress',
  'address',
  'postalCode',
  'street',
  'houseNumber',
  'placeName',
] as const;

function redactNestedUser(user: Record<string, unknown>): Record<string, unknown> {
  const next = { ...user };
  delete next.lat;
  delete next.lng;
  if ('place' in next) {
    next.place = null;
  }
  if (typeof next.city === 'string') {
    next.city = toPublicPlaceLabel(next.city);
  }
  return next;
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

  const location = next.location;
  if (location && typeof location === 'object') {
    const loc = { ...(location as Record<string, unknown>) };
    delete loc.lat;
    delete loc.lng;
    if (typeof loc.place === 'string') loc.place = toPublicPlaceLabel(loc.place);
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
