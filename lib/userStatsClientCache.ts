/**
 * Client-side cache + in-flight deduplication voor /api/user/[id]/stats.
 * Voorkomt tientallen parallelle requests bij een volle feed (zelfde maker op meerdere kaarten).
 */

export type UserStatsPayload = {
  fansCount: number;
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  totalProps: number;
};

export const EMPTY_USER_STATS: UserStatsPayload = {
  fansCount: 0,
  totalFavorites: 0,
  totalReviews: 0,
  averageRating: 0,
  totalViews: 0,
  totalProps: 0,
};

const TTL_MS = 90_000;
const cache = new Map<string, { data: UserStatsPayload; at: number }>();
const inFlight = new Map<string, Promise<UserStatsPayload>>();

function isStatsPayload(x: unknown): x is UserStatsPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.fansCount === "number" &&
    typeof o.totalFavorites === "number" &&
    typeof o.totalReviews === "number" &&
    typeof o.averageRating === "number" &&
    typeof o.totalViews === "number" &&
    typeof o.totalProps === "number"
  );
}

/** Valideert JSON uit statsPreview (feed API). */
export function coerceUserStatsPayload(raw: unknown): UserStatsPayload | null {
  return isStatsPayload(raw) ? raw : null;
}

export function getCachedUserStats(userId: string): UserStatsPayload | null {
  const row = cache.get(userId);
  if (!row) return null;
  if (Date.now() - row.at > TTL_MS) {
    cache.delete(userId);
    return null;
  }
  return row.data;
}

/** Zet cache vóór eerste render (bv. statsPreview uit /api/feed) zodat tiles geen skeleton tonen. */
export function seedCachedUserStats(userId: string, data: UserStatsPayload): void {
  if (!userId || !isStatsPayload(data)) return;
  cache.set(userId, { data, at: Date.now() });
}

/**
 * Haalt stats op; deelt resultaat voor dezelfde userId binnen de TTL.
 * Parseert JSON ook bij niet-2xx zolang de body het stats-schema heeft (API stuurt bij invalid id 200).
 */
export function fetchUserStatsDeduped(userId: string): Promise<UserStatsPayload> {
  const cached = getCachedUserStats(userId);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(userId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const response = await fetch(`/api/user/${userId}/stats`, {
        credentials: "include",
      });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        return EMPTY_USER_STATS;
      }
      const payload = isStatsPayload(data) ? data : EMPTY_USER_STATS;
      cache.set(userId, { data: payload, at: Date.now() });
      return payload;
    } catch {
      return EMPTY_USER_STATS;
    } finally {
      inFlight.delete(userId);
    }
  })();

  inFlight.set(userId, promise);
  return promise;
}
