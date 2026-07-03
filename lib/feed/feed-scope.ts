/**
 * Feed location scope — replaces radiusMode toggle.
 * - nearby: place/GPS + radius filter, nearest first
 * - national: all sale items, no radius/country filter
 * - international: no radius/country filter, farthest-first distance sort
 */

export const FEED_SCOPE_NEARBY = 'nearby' as const;
export const FEED_SCOPE_NATIONAL = 'national' as const;
export const FEED_SCOPE_INTERNATIONAL = 'international' as const;

export type FeedScope =
  | typeof FEED_SCOPE_NEARBY
  | typeof FEED_SCOPE_NATIONAL
  | typeof FEED_SCOPE_INTERNATIONAL;

export type FeedScopeDefaultSort = {
  sortBy: 'newest' | 'price' | 'views' | 'distance';
  sortOrder: 'asc' | 'desc';
};

export function scopeDefaultSort(scope: FeedScope): FeedScopeDefaultSort {
  if (scope === FEED_SCOPE_NEARBY) {
    return { sortBy: 'distance', sortOrder: 'asc' };
  }
  if (scope === FEED_SCOPE_INTERNATIONAL) {
    return { sortBy: 'distance', sortOrder: 'desc' };
  }
  return { sortBy: 'newest', sortOrder: 'desc' };
}

export function scopeUsesFarthestFirstSort(scope: FeedScope): boolean {
  return scope === FEED_SCOPE_INTERNATIONAL;
}

export function normalizeFeedScope(input: string | null | undefined): FeedScope {
  if (input === FEED_SCOPE_INTERNATIONAL) return FEED_SCOPE_INTERNATIONAL;
  if (input === FEED_SCOPE_NEARBY) return FEED_SCOPE_NEARBY;
  return FEED_SCOPE_NATIONAL;
}

export function scopeUsesRadiusFilter(scope: FeedScope): boolean {
  return scope === FEED_SCOPE_NEARBY;
}

/** Legacy sessionStorage — always returns a scope; never infer nearby from radius alone. */
export function scopeFromLegacyPersist(input: {
  scope?: string;
  nationalView?: boolean;
  radiusMode?: string;
}): FeedScope {
  if (input.scope) return normalizeFeedScope(input.scope);
  if (input.nationalView === true) return FEED_SCOPE_NATIONAL;
  // Legacy radiusMode / missing scope → national (do not restore hidden nearby filter).
  return FEED_SCOPE_NATIONAL;
}

/** Strip legacy keys from persisted home feed snapshot before save/restore. */
export function migrateHomeFeedPersist<T extends Record<string, unknown>>(
  raw: T
): T & { scope: FeedScope } {
  const { nationalView: _nv, radiusMode: _rm, ...rest } = raw as T & {
    nationalView?: boolean;
    radiusMode?: string;
  };
  const scope = scopeFromLegacyPersist(
    raw as { scope?: string; nationalView?: boolean; radiusMode?: string }
  );
  return { ...rest, scope } as T & { scope: FeedScope };
}
