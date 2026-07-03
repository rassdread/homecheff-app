/**
 * Client-side feed radius partitioning (scope = nearby only).
 */

import type { FeedScope } from '@/lib/feed/feed-scope';
import { scopeUsesRadiusFilter } from '@/lib/feed/feed-scope';
import { isUnlimitedRadius, isWithinRadiusKm } from '@/lib/geo/local-discovery';

export function hasUsableItemDistanceKm(
  distanceKm: number | null | undefined
): distanceKm is number {
  return (
    distanceKm != null &&
    Number.isFinite(distanceKm) &&
    distanceKm > 0
  );
}

/** Item is within the active radius when distance is known. */
export function isLocalFeedItem(
  distanceKm: number | null | undefined,
  radiusKm: number
): boolean {
  if (isUnlimitedRadius(radiusKm)) return true;
  if (!hasUsableItemDistanceKm(distanceKm)) return false;
  return isWithinRadiusKm(distanceKm, radiusKm);
}

export function partitionSaleItemsByRadius<T extends { distanceKm?: number }>(
  items: T[],
  radiusKm: number,
  opts: { scope: FeedScope }
): { local: T[]; fallback: T[] } {
  if (!scopeUsesRadiusFilter(opts.scope) || isUnlimitedRadius(radiusKm)) {
    return { local: items, fallback: [] };
  }

  const local: T[] = [];
  const fallback: T[] = [];
  for (const item of items) {
    if (isLocalFeedItem(item.distanceKm, radiusKm)) {
      local.push(item);
    } else {
      fallback.push(item);
    }
  }
  return { local, fallback };
}
