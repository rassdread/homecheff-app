/**
 * Start the canonical first /api/feed request as early as possible so it
 * overlaps JS download/parse of GeoFeed — without a second location source.
 *
 * Contract:
 * - Same seed as GeoFeed (`readSeededFeedLocation`)
 * - Same param builder (`buildGeoFeedApiParams`) + nearby soft-national fallback
 * - GeoFeed consumes the in-flight/completed result only when requestKey matches
 * - Mismatch → discard (GeoFeed fetches normally; no dual engines)
 */

import { buildGeoFeedApiParams } from '@/lib/feed/feed-query-params';
import { FEED_FIRST_PAGE_TAKE } from '@/lib/feed/feed-pagination';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL, FEED_SCOPE_INTERNATIONAL } from '@/lib/feed/feed-scope';
import { isNearbyMissingLocation } from '@/lib/feed/nearby-location-state';
import {
  readSeededFeedLocation,
  type SeededFeedLocation,
  type ServerIpApproxSeed,
} from '@/lib/geo/seeded-feed-location';

export type HomeFeedEarlyBootstrapResult = {
  requestKey: string;
  status: number;
  ok: boolean;
  json: unknown;
  startedAt: number;
  completedAt: number;
};

type EarlySlot = {
  requestKey: string;
  startedAt: number;
  promise: Promise<HomeFeedEarlyBootstrapResult | null>;
};

declare global {
  interface Window {
    __HC_EARLY_FEED__?: EarlySlot;
  }
}

/** Mirror GeoFeed first-page query construction from seeded location only. */
export function buildHomeFeedEarlyRequestParams(
  seed: SeededFeedLocation,
  category?: string | null,
): URLSearchParams {
  const appliedPlace = seed.appliedPlace?.trim() || seed.place?.trim() || '';
  const feedCoords =
    !appliedPlace && seed.userLocation
      ? seed.userLocation
      : null;
  const nearbyNeedsLocation = isNearbyMissingLocation({
    scope: FEED_SCOPE_NEARBY,
    appliedPlace,
    feedCoords,
    countryCode: seed.browseCountryCode,
    locationMode: seed.browseLocationMode,
  });
  const softNationalFallback =
    nearbyNeedsLocation &&
    seed.browseLocationMode !== 'country' &&
    seed.browseLocationMode !== 'region' &&
    !seed.browseCountryCode;

  const locationSource =
    softNationalFallback
      ? null
      : seed.browseLocationMode === 'country'
        ? ('country' as const)
        : seed.locationSource === 'gps' ||
            seed.locationSource === 'ip' ||
            seed.locationSource === 'manual' ||
            seed.locationSource === 'profile' ||
            seed.locationSource === 'country'
          ? seed.locationSource
          : null;

  return buildGeoFeedApiParams(
    {
      scope: softNationalFallback
        ? FEED_SCOPE_NATIONAL
        : seed.browseLocationMode === 'country' ||
            seed.browseLocationMode === 'region'
          ? FEED_SCOPE_INTERNATIONAL
          : FEED_SCOPE_NEARBY,
      radius:
        softNationalFallback || seed.browseLocationMode === 'country'
          ? 0
          : seed.radiusKm,
      q: '',
      category: category || 'all',
      lat:
        softNationalFallback || seed.browseLocationMode === 'country'
          ? null
          : (feedCoords?.lat ?? null),
      lng:
        softNationalFallback || seed.browseLocationMode === 'country'
          ? null
          : (feedCoords?.lng ?? null),
      place:
        softNationalFallback || seed.browseLocationMode === 'country'
          ? ''
          : appliedPlace,
      locationSource,
      countryCode: seed.browseCountryCode || null,
      locationMode:
        seed.browseLocationMode === 'global' ? null : seed.browseLocationMode,
    },
    { take: FEED_FIRST_PAGE_TAKE, skip: 0 },
  );
}

function readWindowSlot(): EarlySlot | null {
  if (typeof window === 'undefined') return null;
  return window.__HC_EARLY_FEED__ ?? null;
}

function writeWindowSlot(slot: EarlySlot | null) {
  if (typeof window === 'undefined') return;
  if (!slot) {
    delete window.__HC_EARLY_FEED__;
    return;
  }
  window.__HC_EARLY_FEED__ = slot;
}

/**
 * Begin early first-feed fetch if none is in flight for this key.
 * Safe to call from inline HTML bootstrap and from HomePageClient.
 */
export function startHomeFeedEarlyBootstrap(input: {
  initialFeedPlace?: string | null;
  initialIpApprox?: ServerIpApproxSeed | null;
  category?: string | null;
}): string | null {
  if (typeof window === 'undefined') return null;
  const seed = readSeededFeedLocation(
    input.initialFeedPlace,
    input.initialIpApprox,
  );
  const params = buildHomeFeedEarlyRequestParams(seed, input.category);
  const requestKey = params.toString();
  const existing = readWindowSlot();
  if (existing?.requestKey === requestKey) return requestKey;

  const startedAt = Date.now();
  const promise = (async (): Promise<HomeFeedEarlyBootstrapResult | null> => {
    try {
      const res = await fetch(`/api/feed?${requestKey}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      return {
        requestKey,
        status: res.status,
        ok: res.ok,
        json,
        startedAt,
        completedAt: Date.now(),
      };
    } catch {
      return null;
    }
  })();

  writeWindowSlot({ requestKey, startedAt, promise });
  return requestKey;
}

/**
 * Consume early bootstrap when GeoFeed's canonical requestKey matches.
 * Returns null on miss / failure — caller must fetch normally.
 */
export async function takeHomeFeedEarlyBootstrap(
  requestKey: string,
): Promise<HomeFeedEarlyBootstrapResult | null> {
  const slot = readWindowSlot();
  if (!slot || slot.requestKey !== requestKey) return null;
  const result = await slot.promise;
  // One-shot for this key so filter transitions do not reuse a stale payload.
  if (readWindowSlot()?.requestKey === requestKey) {
    writeWindowSlot(null);
  }
  if (!result || !result.ok || result.requestKey !== requestKey) return null;
  return result;
}

/**
 * Inline script body for homepage HTML — overlaps /api/feed with critical JS.
 * Uses server IP/place seed only (no localStorage). Client bootstrap may replace
 * with a preference-matched key; GeoFeed only consumes on exact key match.
 */
export function buildHomeFeedEarlyBootstrapInlineScript(input: {
  initialFeedPlace?: string | null;
  initialIpApprox?: ServerIpApproxSeed | null;
  category?: string | null;
}): string {
  const seed =
    readSeededFeedLocation(input.initialFeedPlace, input.initialIpApprox);
  const params = buildHomeFeedEarlyRequestParams(seed, input.category);
  const requestKey = params.toString();
  const url = `/api/feed?${requestKey}`;
  // Minimal IIFE — no imports; stores promise on window for GeoFeed take().
  return `(()=>{try{var k=${JSON.stringify(requestKey)};var u=${JSON.stringify(url)};if(window.__HC_EARLY_FEED__&&window.__HC_EARLY_FEED__.requestKey===k)return;var t=Date.now();var p=fetch(u,{cache:'no-store'}).then(function(r){return r.json().then(function(j){return{requestKey:k,status:r.status,ok:r.ok,json:j,startedAt:t,completedAt:Date.now()};},function(){return null;});}).catch(function(){return null;});window.__HC_EARLY_FEED__={requestKey:k,startedAt:t,promise:p};}catch(e){}})();`;
}
