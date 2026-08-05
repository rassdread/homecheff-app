/**
 * Phase 5.6 — Structured browsing location (presentation + feed query).
 * Browsing origin ≠ checkout delivery address.
 */

import { normalizeCountryCode } from '@/lib/gamification/country-code';

export type LocationBrowseSource =
  | 'ip'
  | 'gps'
  | 'manual_place'
  | 'manual_postcode'
  | 'country'
  | 'region'
  | 'global';

export type LocationPrecision =
  | 'country'
  | 'region'
  | 'city'
  | 'postcode'
  | 'gps'
  | 'approx';

/** Point+radius vs country/region boundary vs unrestricted global. */
export type LocationBrowseMode = 'point' | 'country' | 'region' | 'global';

export type StructuredBrowseLocation = {
  source: LocationBrowseSource;
  label: string;
  city?: string;
  municipality?: string;
  region?: string;
  regionCode?: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  placeId?: string;
  precision: LocationPrecision;
  mode: LocationBrowseMode;
};

export function resolveBrowseMode(
  input: Pick<
    StructuredBrowseLocation,
    'precision' | 'lat' | 'lng' | 'countryCode' | 'regionCode'
  >,
): LocationBrowseMode {
  const hasPoint =
    input.lat != null &&
    input.lng != null &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng);
  if (
    hasPoint &&
    (input.precision === 'city' ||
      input.precision === 'postcode' ||
      input.precision === 'gps' ||
      input.precision === 'approx')
  ) {
    return 'point';
  }
  if (input.regionCode?.trim() && input.countryCode?.trim()) return 'region';
  if (input.countryCode?.trim() && input.precision === 'country') return 'country';
  if (input.countryCode?.trim() && !hasPoint) return 'country';
  if (hasPoint) return 'point';
  return 'global';
}

export function formatBrowseLocationLabel(loc: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}): string {
  const country =
    loc.country?.trim() ||
    loc.countryCode?.trim()?.toUpperCase() ||
    '';
  if (loc.postalCode?.trim() && loc.city?.trim()) {
    return [loc.postalCode.trim(), loc.city.trim(), loc.region?.trim(), country]
      .filter(Boolean)
      .join(', ');
  }
  if (loc.city?.trim()) {
    return [loc.city.trim(), loc.region?.trim(), country].filter(Boolean).join(', ');
  }
  if (loc.region?.trim() && country) {
    return `${loc.region.trim()}, ${country}`;
  }
  return country || 'Global';
}

export function isPointBrowseMode(mode: LocationBrowseMode | null | undefined): boolean {
  return mode === 'point';
}

export function isBoundaryBrowseMode(
  mode: LocationBrowseMode | null | undefined,
): boolean {
  return mode === 'country' || mode === 'region';
}

/** ISO alpha-2 or null. */
export function toIsoCountryCode(input: string | null | undefined): string | null {
  return normalizeCountryCode(input);
}

/** Curated browse country list (ISO + English label). */
export const BROWSE_COUNTRY_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'SR', name: 'Suriname' },
  { code: 'CW', name: 'Curaçao' },
  { code: 'AW', name: 'Aruba' },
  { code: 'SX', name: 'Sint Maarten' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'PL', name: 'Poland' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
] as const;

export function countryOptionLabel(code: string): string {
  const hit = BROWSE_COUNTRY_OPTIONS.find((c) => c.code === code);
  return hit ? `${hit.name} (${hit.code})` : code;
}
