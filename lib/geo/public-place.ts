/**
 * Public Marketplace location.
 * Stored addresses and coordinates stay on the server for distance,
 * delivery and post-accept exchange. Public text is city or neighbourhood.
 */

const STREET_SUFFIX =
  /\b(straat|laan|weg|plein|singel|kade|gracht|hof|dreef|baan|steeg|pad|dijk|plantsoen|boulevard|avenue|street|road|lane|court|drive)\b/i;

const NL_POSTCODE = /\b\d{4}\s?[A-Za-z]{2}\b/;
const LEADING_POSTCODE = /^\d{4}(?:\s?[A-Za-z]{2})?\s+/;
const HOUSE_NUMBER = /(?:^|\s)\d{1,4}[A-Za-z]?(?:\s|$)/;

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

const PRECISE_KEYS = [
  'lat',
  'lng',
  'pickupLat',
  'pickupLng',
  'pickupAddress',
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
