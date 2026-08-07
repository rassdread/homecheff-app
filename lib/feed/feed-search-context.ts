/**
 * Pure helpers for the read-only Feed Search Context Bar.
 * Consumes GeoFeed applied state only — no draft values, no new feed ownership.
 */

import type { FeedScope } from '@/lib/feed/feed-scope';
import { scopeUsesRadiusFilter } from '@/lib/feed/feed-scope';
import { isUnlimitedRadius } from '@/lib/geo/local-discovery';

export type SearchContextLocationSource =
  | 'gps'
  | 'manual'
  | 'profile'
  | 'ip'
  | 'country'
  | null;

export type SearchContextLocationKind =
  | 'address'
  | 'postcode'
  | 'place'
  | 'gps'
  | 'approx'
  | 'profile'
  | 'country'
  | 'fallback';

export type ResolvedSearchContextLocation = {
  kind: SearchContextLocationKind;
  /** Human-readable origin — never lat/lng. */
  label: string | null;
};

const NL_POSTCODE_RE = /^\d{4}\s*[A-Za-z]{2}\b/;

function looksLikePostcode(value: string): boolean {
  return NL_POSTCODE_RE.test(value.trim());
}

/**
 * Location display priority:
 * 1. Exact entered address / postcode / place (appliedPlace)
 * 2. GPS current location (friendly label or generic)
 * 3. Profile place / postcode
 * 4. Approximate IP label
 * 5. Country boundary
 * 6. Friendly fallback (null label → caller translates)
 */
export function resolveSearchContextLocation(
  input: {
    appliedPlace: string;
    locationSource: SearchContextLocationSource;
    gpsDisplayLabel?: string | null;
    ipLocationLabel?: string | null;
    profilePlace?: string | null;
    profilePostcode?: string | null;
    countryCode?: string | null;
    browseLocationMode?: 'point' | 'country' | 'region' | 'global' | null;
  },
): ResolvedSearchContextLocation {
  const place = input.appliedPlace.trim();
  if (place) {
    if (looksLikePostcode(place)) {
      return { kind: 'postcode', label: place };
    }
    // Free-text may be a full address or a city — treat as address when it has
    // street-like tokens, otherwise place.
    if (/\d/.test(place) && /\s/.test(place)) {
      return { kind: 'address', label: place };
    }
    return { kind: 'place', label: place };
  }

  if (input.locationSource === 'gps') {
    const gpsLabel = input.gpsDisplayLabel?.trim() || null;
    return { kind: 'gps', label: gpsLabel };
  }

  if (input.locationSource === 'profile') {
    const profilePlace = input.profilePlace?.trim() || null;
    const profilePostcode = input.profilePostcode?.trim() || null;
    if (profilePlace) return { kind: 'profile', label: profilePlace };
    if (profilePostcode) return { kind: 'profile', label: profilePostcode };
    return { kind: 'profile', label: null };
  }

  if (input.locationSource === 'ip') {
    const approx = input.ipLocationLabel?.trim() || null;
    return { kind: 'approx', label: approx };
  }

  if (
    input.locationSource === 'country' ||
    input.browseLocationMode === 'country' ||
    input.browseLocationMode === 'region'
  ) {
    const cc = input.countryCode?.trim().toUpperCase() || null;
    return { kind: 'country', label: cc };
  }

  // Soft national / no viewer location
  return { kind: 'fallback', label: null };
}

export type SearchContextChipId =
  | 'location'
  | 'radius'
  | 'category'
  | 'sort'
  | 'query';

export type SearchContextChip = {
  id: SearchContextChipId;
  /** Decorative marker (presentation only). */
  marker: string;
  /** Visible value text (already localized by caller where needed). */
  value: string;
};

export type BuildSearchContextChipsInput = {
  scope: FeedScope;
  appliedRadiusKm: number;
  appliedCategory: string;
  appliedSortBy: 'newest' | 'price' | 'views' | 'distance';
  /** Localized category label when category !== all; null to omit. */
  categoryLabel: string | null;
  /** Localized sort label. */
  sortLabel: string;
  /** Localized radius value e.g. "10 km" or unlimited label. */
  radiusLabel: string | null;
  /** Localized location value (already resolved). */
  locationLabel: string;
  /** Applied refine / q when non-empty. */
  appliedQuery?: string | null;
  /** Show sort chip (caller decides default-vs-active policy). */
  showSort?: boolean;
};

/**
 * Build the active context chips from applied feed state.
 * Omits inactive filters (no category when "all", no radius outside Nearby).
 */
export function buildSearchContextChips(
  input: BuildSearchContextChipsInput,
): SearchContextChip[] {
  const chips: SearchContextChip[] = [
    {
      id: 'location',
      marker: '📍',
      value: input.locationLabel,
    },
  ];

  if (scopeUsesRadiusFilter(input.scope) && input.radiusLabel) {
    chips.push({
      id: 'radius',
      marker: '📏',
      value: input.radiusLabel,
    });
  }

  if (input.appliedCategory && input.appliedCategory !== 'all' && input.categoryLabel) {
    chips.push({
      id: 'category',
      marker: categoryMarker(input.appliedCategory),
      value: input.categoryLabel,
    });
  }

  const showSort = input.showSort !== false;
  if (showSort && input.sortLabel.trim()) {
    chips.push({
      id: 'sort',
      marker: '↕',
      value: input.sortLabel,
    });
  }

  const q = input.appliedQuery?.trim();
  if (q) {
    chips.push({
      id: 'query',
      marker: '🔎',
      value: q,
    });
  }

  return chips;
}

function categoryMarker(slug: string): string {
  if (slug === 'cheff' || slug === 'food') return '🍽';
  if (slug === 'services') return '🛠';
  if (slug === 'designer' || slug === 'creations') return '🎨';
  if (slug === 'garden') return '🌱';
  return '🏷';
}

export function formatSearchContextRadiusKm(
  radiusKm: number,
  unlimitedLabel: string,
): string | null {
  if (!Number.isFinite(radiusKm)) return null;
  if (isUnlimitedRadius(radiusKm)) return unlimitedLabel;
  return `${radiusKm} km`;
}
