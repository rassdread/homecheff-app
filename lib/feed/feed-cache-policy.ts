/**
 * Feed CDN / browser cache classification (Phase 3B).
 *
 * A — anonymous default national feed (CDN allowed)
 * B — location-dependent (lat/lng, place, nearby scope, radius)
 * C — user-dependent (session, follows, personalized discovery)
 * D — diagnostic / must never cache (perf timing, explicit bust)
 */

import { isFeedApiTimingEnabled } from '@/lib/feed/feed-api-timing';
import { normalizeFeedScope, scopeUsesRadiusFilter } from '@/lib/feed/feed-scope';

export type FeedCacheTier = 'A' | 'B' | 'C' | 'D';

export type FeedCacheClassificationInput = {
  userId: string | null;
  q: string;
  placeParam: string;
  vertical: string;
  lat: string | null;
  lng: string | null;
  hasSubfilters: boolean;
  feedScope: string;
  skip: number;
  radiusKm: number;
  searchParams: URLSearchParams;
};

export type FeedCachePolicy = {
  tier: FeedCacheTier;
  cacheControl: string;
  vary: string[];
  cdnAllowed: boolean;
  reasons: string[];
};

function hasPerfOrDebugBypass(searchParams: URLSearchParams): boolean {
  if (process.env.NODE_ENV === 'production') {
    if (
      process.env.FEED_PERF_TIMING === '1' &&
      searchParams.get('perfProbe') === '1'
    ) {
      return true;
    }
  } else if (isFeedApiTimingEnabled()) {
    return true;
  }
  if (searchParams.has('perfBust') || searchParams.has('_perf')) return true;
  if (searchParams.has('_bust')) return true;
  if (searchParams.get('debug') === '1') return true;
  return false;
}

/** National scope with radius 0 — coords alone do not select/filter items. */
export function isNationalLabelsOnlyCoords(input: {
  feedScope: string;
  radiusKm: number;
  placeParam: string;
}): boolean {
  const scope = normalizeFeedScope(input.feedScope);
  if (scope !== 'national') return false;
  if (input.placeParam.trim()) return false;
  if (input.radiusKm > 0) return false;
  return true;
}

export function isAnonymousNationalFirstPageTierA(
  input: FeedCacheClassificationInput,
): boolean {
  if (hasPerfOrDebugBypass(input.searchParams)) return false;
  if (input.userId) return false;
  if (input.skip > 0) return false;
  if (input.q.trim() || input.hasSubfilters || input.vertical !== 'all') {
    return false;
  }
  const scope = normalizeFeedScope(input.feedScope);
  if (scope !== 'national') return false;
  if (input.placeParam.trim()) return false;
  if (input.radiusKm > 0) return false;
  return true;
}

export function classifyFeedCachePolicy(
  input: FeedCacheClassificationInput,
): FeedCachePolicy {
  const reasons: string[] = [];
  const scope = normalizeFeedScope(input.feedScope);
  const vary: string[] = ['Origin'];

  if (hasPerfOrDebugBypass(input.searchParams)) {
    reasons.push('perf_or_debug_bypass');
    return {
      tier: 'D',
      cacheControl: 'private, no-store, no-cache',
      vary,
      cdnAllowed: false,
      reasons,
    };
  }

  if (input.userId) {
    reasons.push('authenticated_session');
    return {
      tier: 'C',
      cacheControl: 'private, no-store',
      vary: [...vary, 'Cookie'],
      cdnAllowed: false,
      reasons,
    };
  }

  if (
    input.q.trim() ||
    input.hasSubfilters ||
    input.vertical !== 'all' ||
    input.skip > 0
  ) {
    reasons.push('filtered_or_paginated');
    return {
      tier: 'C',
      cacheControl: 'private, no-store',
      vary,
      cdnAllowed: false,
      reasons,
    };
  }

  const hasCoords =
    input.lat != null &&
    input.lng != null &&
    input.lat.trim() !== '' &&
    input.lng.trim() !== '';

  const nationalLabelsOnly =
    isNationalLabelsOnlyCoords({
      feedScope: input.feedScope,
      radiusKm: input.radiusKm,
      placeParam: input.placeParam,
    }) && hasCoords;

  const locationDependent =
    input.placeParam.trim() ||
    input.radiusKm > 0 ||
    (scopeUsesRadiusFilter(scope) && scope !== 'national') ||
    (hasCoords && !nationalLabelsOnly);

  if (locationDependent) {
    reasons.push('location_dependent');
    return {
      tier: 'B',
      cacheControl: 'private, max-age=0, must-revalidate',
      vary: [...vary, 'Cookie'],
      cdnAllowed: false,
      reasons,
    };
  }

  if (nationalLabelsOnly) {
    reasons.push('anonymous_national_labels_only_coords');
  } else {
    reasons.push('anonymous_default_national');
  }
  return {
    tier: 'A',
    cacheControl: 'public, max-age=0, must-revalidate',
    vary,
    cdnAllowed: true,
    reasons,
  };
}

export function buildFeedResponseCacheHeaders(
  policy: FeedCachePolicy,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (policy.tier === 'A') {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    headers['CDN-Cache-Control'] =
      'public, s-maxage=45, stale-while-revalidate=90';
    headers['Vercel-CDN-Cache-Control'] =
      'public, s-maxage=45, stale-while-revalidate=90';
    headers['X-Feed-Cache-Tier'] = 'A';
  } else {
    headers['Cache-Control'] = policy.cacheControl;
  }

  if (policy.vary.length > 0) {
    headers.Vary = policy.vary.join(', ');
  }

  return headers;
}
