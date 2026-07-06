import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import type { DiscoveryFeedPayload } from '@/lib/feed/discovery-feed-contract';

/** In-tab memory cache — survives GeoFeed remount on client navigations within the same tab. */
const MAX_AGE_MS = 8 * 60 * 1000;

export type HomeFeedViewerCoords = { lat: number; lng: number };

export type HomeFeedReturnCachePayload = {
  requestKey: string;
  items: unknown[];
  inspiratiePool: InspirationItem[];
  apiViewerCoords: HomeFeedViewerCoords | null;
  nativeFeedRenderMore: boolean;
  discoveryFeed: DiscoveryFeedPayload | null;
  savedAt: number;
};

let memoryCache: HomeFeedReturnCachePayload | null = null;

export function saveHomeFeedReturnCache(
  payload: Omit<HomeFeedReturnCachePayload, 'savedAt'>,
): void {
  if (!payload.requestKey || payload.items.length === 0) return;
  memoryCache = { ...payload, savedAt: Date.now() };
}

export function readHomeFeedReturnCache(
  requestKey: string,
): HomeFeedReturnCachePayload | null {
  if (!memoryCache) return null;
  if (memoryCache.requestKey !== requestKey) return null;
  if (Date.now() - memoryCache.savedAt > MAX_AGE_MS) return null;
  return memoryCache;
}

export function peekFreshHomeFeedReturnCache(): HomeFeedReturnCachePayload | null {
  if (!memoryCache) return null;
  if (Date.now() - memoryCache.savedAt > MAX_AGE_MS) return null;
  return memoryCache;
}

export function clearHomeFeedReturnCache(): void {
  memoryCache = null;
}
