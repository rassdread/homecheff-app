/**
 * Geographic product contract for HomeCheff feed scopes.
 *
 * - nearby: viewer coords + radius; distance-verified; never silent national.
 * - national ("Heel Nederland"): European mainland Netherlands only.
 *   Sint Maarten (SX), Curaçao (CW), Aruba (AW), Caribbean Netherlands (BQ)
 *   and other foreign/overseas territories are NOT national — they belong in
 *   international.
 * - international: worldwide including the Netherlands (farthest-first sort).
 */

export const KINGDOM_CARIBBEAN_COUNTRY_CODES = [
  'SX', // Sint Maarten
  'CW', // Curaçao
  'AW', // Aruba
  'BQ', // Bonaire, Sint Eustatius, Saba
  'MF', // Saint-Martin (FR) — adjacent; treat as Caribbean overseas
] as const;

/** Rough European mainland NL bbox (excludes Caribbean / overseas). */
export const NL_MAINLAND_BBOX = {
  latMin: 50.75,
  latMax: 53.55,
  lngMin: 3.2,
  lngMax: 7.22,
} as const;

export type GeoCoords = { lat: number; lng: number };

export function normalizeCountryCode(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const t = input.trim().toUpperCase();
  if (!t) return null;
  if (t === 'NEDERLAND' || t === 'NETHERLANDS' || t === 'THE NETHERLANDS') {
    return 'NL';
  }
  if (t === 'SINT MAARTEN' || t === 'ST. MAARTEN' || t === 'ST MAARTEN') {
    return 'SX';
  }
  if (t === 'CURACAO' || t === 'CURAÇAO') return 'CW';
  if (t === 'ARUBA') return 'AW';
  if (t.length === 2) return t;
  return t.slice(0, 2);
}

export function isKingdomCaribbeanCountryCode(
  code: string | null | undefined,
): boolean {
  const c = normalizeCountryCode(code);
  if (!c) return false;
  return (KINGDOM_CARIBBEAN_COUNTRY_CODES as readonly string[]).includes(c);
}

/**
 * Place-label fallback when coords/country are missing (common on DISH inspiration).
 * Matches Caribbean Kingdom territory names that must never appear under national.
 */
export function isKingdomCaribbeanPlaceLabel(
  place: string | null | undefined,
): boolean {
  if (!place) return false;
  const p = place
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (!p) return false;
  // Exact / near-exact common place strings stored on listings.
  if (
    p === 'sint maarten' ||
    p === 'st. maarten' ||
    p === 'st maarten' ||
    p === 'philipsburg' ||
    p === 'curacao' ||
    p === 'willemstad' ||
    p === 'aruba' ||
    p === 'oranjestad' ||
    p === 'bonaire' ||
    p === 'kralendijk' ||
    p === 'sint eustatius' ||
    p === 'statia' ||
    p === 'saba' ||
    p === 'the bottom'
  ) {
    return true;
  }
  // Containment for longer labels ("Sint Maarten, Caribbean").
  return (
    p.includes('sint maarten') ||
    p.includes('st. maarten') ||
    p.includes('st maarten') ||
    p.includes('curacao') ||
    p.includes('aruba') ||
    p.includes('bonaire') ||
    p.includes('sint eustatius') ||
    p === 'saba' ||
    p.startsWith('saba ')
  );
}

export function isInsideNlMainlandBbox(coords: GeoCoords | null | undefined): boolean {
  if (!coords) return false;
  const { lat, lng } = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= NL_MAINLAND_BBOX.latMin &&
    lat <= NL_MAINLAND_BBOX.latMax &&
    lng >= NL_MAINLAND_BBOX.lngMin &&
    lng <= NL_MAINLAND_BBOX.lngMax
  );
}

/**
 * National scope eligibility for a listing (sale or inspiration).
 * Prefer coords (bbox). Country code alone is insufficient when defaults are "NL".
 * Place labels cover DISH rows that have no lat/lng but say "Sint Maarten".
 */
export function isNationalNetherlandsListing(input: {
  coords: GeoCoords | null | undefined;
  countryCode?: string | null;
  place?: string | null;
}): boolean {
  if (isKingdomCaribbeanPlaceLabel(input.place)) return false;
  if (isKingdomCaribbeanCountryCode(input.countryCode)) return false;
  if (isInsideNlMainlandBbox(input.coords)) return true;
  // No reliable mainland coords → not national (avoid SX mislabeled as NL).
  return false;
}

/**
 * National pool gate: sales require mainland coords; non-sales may keep
 * mainland-coords OR no-coords mainland-looking places (not Caribbean labels).
 */
export function isEligibleForNationalFeedScope(input: {
  coords: GeoCoords | null | undefined;
  countryCode?: string | null;
  place?: string | null;
  isMarketplaceSale: boolean;
}): boolean {
  if (isKingdomCaribbeanPlaceLabel(input.place)) return false;
  if (isKingdomCaribbeanCountryCode(input.countryCode)) return false;
  if (input.isMarketplaceSale) {
    return isNationalNetherlandsListing({
      coords: input.coords,
      countryCode: input.countryCode,
      place: input.place,
    });
  }
  if (input.coords) return isInsideNlMainlandBbox(input.coords);
  // Inspiration without coords: allow only when place is not Caribbean.
  return true;
}

/** International = worldwide, including mainland NL. */
export function isInternationalListing(_input: {
  coords: GeoCoords | null | undefined;
  countryCode?: string | null;
}): boolean {
  return true;
}
