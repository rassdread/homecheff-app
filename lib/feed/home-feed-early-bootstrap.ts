/**
 * Start the canonical first /api/feed request as early as possible so it
 * overlaps JS download/parse of GeoFeed — without a second location source.
 *
 * Contract (PERFORMANCE HINT — not authoritative):
 * - Same seed as GeoFeed (`readSeededFeedLocation`)
 * - Same param builder (`buildGeoFeedApiParams`) + nearby soft-national fallback
 * - GeoFeed may consume a fast hit when requestKey matches
 * - Wait is BOUNDED (`HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS`) for UI paint
 * - On UI timeout the network promise stays joinable for the SAME requestKey
 *   (no duplicate first-page DB work). Failed shared work may retry once.
 * - Mismatch / non-2xx → discard for UI (no dual engines)
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

/** Max time GeoFeed may wait on early bootstrap before continuing (join/retry). */
export const HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS = 2500;

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
  /**
   * UI timed out waiting — late settle must not be applied via take().
   * Network work remains joinable via joinOrFetchHomeFeedFirstPage.
   */
  ignored?: boolean;
};

/** Plain object so inline homepage script and modules share one registry. */
type InflightStore = Record<
  string,
  Promise<HomeFeedEarlyBootstrapResult | null>
>;

declare global {
  interface Window {
    __HC_EARLY_FEED__?: EarlySlot;
    __HC_FEED_INFLIGHT__?: InflightStore;
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

function getInflightStore(): InflightStore | null {
  if (typeof window === 'undefined') return null;
  if (!window.__HC_FEED_INFLIGHT__) {
    window.__HC_FEED_INFLIGHT__ = Object.create(null) as InflightStore;
  }
  return window.__HC_FEED_INFLIGHT__;
}

function registerInflight(
  requestKey: string,
  promise: Promise<HomeFeedEarlyBootstrapResult | null>,
): void {
  const store = getInflightStore();
  if (!store) return;
  store[requestKey] = promise;
  void promise.finally(() => {
    if (store[requestKey] === promise) {
      delete store[requestKey];
    }
  });
}

function readInflight(
  requestKey: string,
): Promise<HomeFeedEarlyBootstrapResult | null> | null {
  const store = getInflightStore();
  return store?.[requestKey] ?? null;
}

async function fetchHomeFeedFirstPage(
  requestKey: string,
  url: string,
  signal?: AbortSignal,
): Promise<HomeFeedEarlyBootstrapResult | null> {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { cache: 'no-store', signal });
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
}

/**
 * Pure bounded race used by takeHomeFeedEarlyBootstrap (and unit tests).
 * Timeout wins → null for UI; late promise may still be joined for network reuse.
 */
export function raceHomeFeedEarlyBootstrap<T>(
  promise: Promise<T | null>,
  waitMs: number,
): Promise<{ timedOut: boolean; value: T | null }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (timedOut: boolean, value: T | null) => {
      if (settled) return;
      settled = true;
      resolve({ timedOut, value });
    };
    const timer = setTimeout(() => finish(true, null), Math.max(0, waitMs));
    void promise.then(
      (value) => {
        clearTimeout(timer);
        finish(false, value ?? null);
      },
      () => {
        clearTimeout(timer);
        finish(false, null);
      },
    );
  });
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
  const existingInflight = readInflight(requestKey);
  const existing = readWindowSlot();
  if (existingInflight) {
    if (!existing || existing.requestKey !== requestKey) {
      writeWindowSlot({
        requestKey,
        startedAt: Date.now(),
        promise: existingInflight,
        ignored: false,
      });
    }
    return requestKey;
  }
  if (existing?.requestKey === requestKey && !existing.ignored) {
    registerInflight(requestKey, existing.promise);
    return requestKey;
  }

  const url = `/api/feed?${requestKey}`;
  const promise = fetchHomeFeedFirstPage(requestKey, url);
  registerInflight(requestKey, promise);
  writeWindowSlot({
    requestKey,
    startedAt: Date.now(),
    promise,
    ignored: false,
  });
  return requestKey;
}

/**
 * Opportunistically consume early bootstrap when requestKey matches.
 * Waits at most `waitMs` (default HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS).
 * On timeout/fail/mismatch → null; caller should joinOrFetch (same key),
 * not blindly start a duplicate network request.
 * Timed-out slots are marked ignored for UI take() only — inflight stays.
 */
export async function takeHomeFeedEarlyBootstrap(
  requestKey: string,
  opts?: { waitMs?: number },
): Promise<HomeFeedEarlyBootstrapResult | null> {
  const waitMs = opts?.waitMs ?? HOME_FEED_EARLY_BOOTSTRAP_WAIT_MS;
  const slot = readWindowSlot();
  if (!slot || slot.requestKey !== requestKey || slot.ignored) return null;

  const { timedOut, value: result } = await raceHomeFeedEarlyBootstrap(
    slot.promise,
    waitMs,
  );

  if (timedOut) {
    const current = readWindowSlot();
    if (current && current.requestKey === requestKey) {
      current.ignored = true;
    }
    return null;
  }

  // One-shot UI consume for this key; inflight map clears on settle.
  if (readWindowSlot()?.requestKey === requestKey) {
    writeWindowSlot(null);
  }
  if (!result || !result.ok || result.requestKey !== requestKey) return null;
  return result;
}

/**
 * Join an identical in-flight first-page request, or start one.
 * Used by GeoFeed after a bounded early take() miss so the expensive
 * nearby first page is not duplicated.
 *
 * - Same requestKey → reuse promise
 * - Failed/settled miss → fresh fetch (map entry already cleared)
 * - Different key → independent request (caller passes its key)
 * - AbortSignal only applies to fetches this call starts (not shared joins)
 */
export async function joinOrFetchHomeFeedFirstPage(
  requestKey: string,
  url: string,
  signal?: AbortSignal,
): Promise<HomeFeedEarlyBootstrapResult | null> {
  if (typeof window === 'undefined') {
    return fetchHomeFeedFirstPage(requestKey, url, signal);
  }

  const existing = readInflight(requestKey);
  if (existing) {
    const joined = await existing;
    if (joined?.ok && joined.requestKey === requestKey) {
      return joined;
    }
    // Shared work failed/non-OK — allow a fresh retry below.
  }

  const slot = readWindowSlot();
  if (slot && slot.requestKey === requestKey) {
    const joined = await slot.promise;
    if (readWindowSlot()?.requestKey === requestKey) {
      writeWindowSlot(null);
    }
    if (joined?.ok && joined.requestKey === requestKey) {
      return joined;
    }
  }

  if (signal?.aborted) return null;

  const promise = fetchHomeFeedFirstPage(requestKey, url, signal);
  registerInflight(requestKey, promise);
  return promise;
}

/**
 * Inline script body for homepage HTML — overlaps /api/feed with critical JS.
 * Registers both __HC_EARLY_FEED__ and __HC_FEED_INFLIGHT__[key] so GeoFeed
 * can join the same network promise after the bounded UI wait.
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
  return `(()=>{try{var k=${JSON.stringify(requestKey)};var u=${JSON.stringify(url)};var store=window.__HC_FEED_INFLIGHT__=window.__HC_FEED_INFLIGHT__||Object.create(null);if(store[k]){if(!window.__HC_EARLY_FEED__||window.__HC_EARLY_FEED__.requestKey!==k){window.__HC_EARLY_FEED__={requestKey:k,startedAt:Date.now(),promise:store[k],ignored:false};}return;}if(window.__HC_EARLY_FEED__&&window.__HC_EARLY_FEED__.requestKey===k&&!window.__HC_EARLY_FEED__.ignored){store[k]=window.__HC_EARLY_FEED__.promise;return;}var t=Date.now();var p=fetch(u,{cache:'no-store'}).then(function(r){return r.json().then(function(j){return{requestKey:k,status:r.status,ok:r.ok,json:j,startedAt:t,completedAt:Date.now()};},function(){return null;});}).catch(function(){return null;});p.finally(function(){if(store[k]===p)delete store[k];});store[k]=p;window.__HC_EARLY_FEED__={requestKey:k,startedAt:t,promise:p,ignored:false};}catch(e){}})();`;
}
