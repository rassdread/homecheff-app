/**
 * Maps GeoFeed UI filter state → API query params.
 * @see docs/HOMECHEFF_LOCAL_DISCOVERY.md
 */

import type { FeedScope } from '@/lib/feed/feed-scope';
import { scopeUsesRadiusFilter } from '@/lib/feed/feed-scope';
import { feedVerticalSlugToCategoryEnum } from '@/lib/feed/feed-client-sort';

export type GeoFeedApiParamsInput = {
  scope: FeedScope;
  radius: number;
  q?: string;
  category?: string;
  lat?: number | null;
  lng?: number | null;
  place?: string;
  locationSource?: 'gps' | 'manual' | 'profile' | null;
};

/** Build `/api/feed` search params from GeoFeed filter state. */
export function buildGeoFeedApiParams(input: GeoFeedApiParamsInput): URLSearchParams {
  const params = new URLSearchParams();
  const nearby = scopeUsesRadiusFilter(input.scope);

  params.set('radius', nearby ? String(input.radius) : '0');
  params.set('scope', input.scope);

  if (nearby) {
    if (input.locationSource === 'manual' && input.place?.trim()) {
      params.set('place', input.place.trim());
    } else if (
      input.lat != null &&
      input.lng != null &&
      Number.isFinite(input.lat) &&
      Number.isFinite(input.lng)
    ) {
      params.set('lat', String(input.lat));
      params.set('lng', String(input.lng));
    } else if (input.place?.trim()) {
      params.set('place', input.place.trim());
    }
  } else if (
    input.lat != null &&
    input.lng != null &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    // National/international: viewer coords for distance labels only — not for filtering.
    params.set('lat', String(input.lat));
    params.set('lng', String(input.lng));
  } else if (input.place?.trim()) {
    // No stored coords — geocode profile/applied place for distance labels only.
    params.set('place', input.place.trim());
  }

  if (input.q?.trim()) params.set('q', input.q.trim());
  if (input.category && input.category !== 'all') {
    params.set('vertical', input.category);
  }

  return params;
}

/** Build `/api/inspiratie` category param from GeoFeed vertical slug. */
export function buildInspiratieCategoryParam(categorySlug: string): string {
  if (!categorySlug || categorySlug === 'all') return 'all';
  const mapped = feedVerticalSlugToCategoryEnum(categorySlug);
  return mapped ?? 'all';
}

export const GEOFEED_CLIENT_ONLY_FILTERS = [
  'feedChip',
  'searchQuery',
  'priceMin',
  'priceMax',
  'sortBy',
  'sortOrder',
  'scope',
] as const;
