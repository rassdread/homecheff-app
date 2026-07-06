/**
 * Client-side cache + in-flight deduplication voor /api/user/[id]/stats.
 */
export type UserStatsPayload = {
  fansCount: number;
  followingCount?: number;
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  /** Workspace props received (not listing saves). */
  totalProps: number;
  /** Dish community feedback count — non-trust. */
  communityFeedbackCount?: number;
};

export const EMPTY_USER_STATS: UserStatsPayload = {
  fansCount: 0,
  followingCount: 0,
  totalFavorites: 0,
  totalReviews: 0,
  averageRating: 0,
  totalViews: 0,
  totalProps: 0,
  communityFeedbackCount: 0,
};

const TTL_MS = 90_000;
const cache = new Map<string, { data: UserStatsPayload; at: number }>();
const inFlight = new Map<string, Promise<UserStatsPayload>>();

function isStatsPayload(x: unknown): x is UserStatsPayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.fansCount === 'number' &&
    typeof o.totalFavorites === 'number' &&
    typeof o.totalReviews === 'number' &&
    typeof o.averageRating === 'number' &&
    typeof o.totalViews === 'number' &&
    typeof o.totalProps === 'number'
  );
}

export function coerceUserStatsPayload(raw: unknown): UserStatsPayload | null {
  if (!isStatsPayload(raw)) return null;
  return {
    ...raw,
    communityFeedbackCount:
      typeof raw.communityFeedbackCount === 'number'
        ? raw.communityFeedbackCount
        : 0,
  };
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

export function seedCachedUserStats(userId: string, data: UserStatsPayload): void {
  if (!userId || !isStatsPayload(data)) return;
  cache.set(userId, { data, at: Date.now() });
}

export function fetchUserStatsDeduped(userId: string): Promise<UserStatsPayload> {
  const cached = getCachedUserStats(userId);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(userId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const response = await fetch(`/api/user/${userId}/stats`, {
        credentials: 'include',
      });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        return EMPTY_USER_STATS;
      }
      const payload = coerceUserStatsPayload(data) ?? EMPTY_USER_STATS;
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

/** @deprecated use EMPTY_USER_STATS */
export const EMPTY_USER_PUBLIC_STATS = EMPTY_USER_STATS;
