/**
 * Preview/dev geo-feed diagnostics — no secrets, no full addresses.
 * Enable: NEXT_PUBLIC_GEO_FEED_DIAGNOSTICS=1 or Vercel Preview.
 */

import type { NearbyLocationStatus } from '@/lib/feed/nearby-location-state';

export type GeoFeedDiagPlatform = 'web' | 'android' | 'ios' | 'unknown';

export type GeoFeedDiagEvent = {
  requestId: string;
  at: string;
  platform: GeoFeedDiagPlatform;
  authenticated: boolean | null;
  selectedScope: string;
  radiusKm: number | null;
  latitude: number | null;
  longitude: number | null;
  countryCode: string | null;
  pageCursor: { take: number; skip: number } | null;
  cacheMode: 'miss' | 'hit' | 'stale-refresh' | 'bypass' | 'unknown';
  cacheHit: boolean | null;
  apiBranch: string | null;
  resultCount: number | null;
  resultListingIds: string[];
  resultCities: string[];
  resultCountries: string[];
  startedAt: number | null;
  endedAt: number | null;
  status: 'started' | 'accepted' | 'aborted' | 'stale' | 'error';
  /** Nearby location product integrity (GPS / empty state / results). */
  nearbyLocationStatus?: NearbyLocationStatus | null;
  note?: string;
};

const MAX_EVENTS = 40;

function isEnabled(): boolean {
  if (typeof process !== 'undefined') {
    if (process.env.NEXT_PUBLIC_GEO_FEED_DIAGNOSTICS === '1') return true;
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') return true;
    if (process.env.VERCEL_ENV === 'preview') return true;
    if (process.env.NODE_ENV === 'development') return true;
  }
  return false;
}

function store(): GeoFeedDiagEvent[] {
  if (typeof window === 'undefined') return [];
  const w = window as Window & { __hcGeoFeedDiagLog?: GeoFeedDiagEvent[] };
  if (!w.__hcGeoFeedDiagLog) w.__hcGeoFeedDiagLog = [];
  return w.__hcGeoFeedDiagLog;
}

export function isGeoFeedDiagnosticsEnabled(): boolean {
  return isEnabled();
}

export function pushGeoFeedDiag(event: GeoFeedDiagEvent): void {
  if (!isEnabled() || typeof window === 'undefined') return;
  const log = store();
  log.unshift(event);
  if (log.length > MAX_EVENTS) log.length = MAX_EVENTS;
  (
    window as Window & { __hcGeoFeedDiagReport?: () => GeoFeedDiagEvent[] }
  ).__hcGeoFeedDiagReport = () => [...store()];
  if (process.env.NODE_ENV === 'development' || isEnabled()) {
    // Safe compact console signal for manual Preview certification
    console.info('[hc-geo-diag]', {
      id: event.requestId,
      status: event.status,
      scope: event.selectedScope,
      nearbyLocationStatus: event.nearbyLocationStatus ?? null,
      radius: event.radiusKm,
      lat: event.latitude,
      lng: event.longitude,
      count: event.resultCount,
      cities: event.resultCities.slice(0, 8),
      countries: event.resultCountries.slice(0, 8),
      cache: event.cacheMode,
      note: event.note,
    });
  }
}

export function newGeoFeedRequestId(): string {
  return `gf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
