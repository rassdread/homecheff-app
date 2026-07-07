/**
 * Unified session-scoped SWR cache (UX-FIN-4C.1/4C.2).
 *
 * One consistent architecture for "instant show, background refresh" across
 * surfaces (notifications, operations, profile lists, ...). Small payloads only;
 * the server/API remains the source of truth. Cache is per-tab (sessionStorage)
 * so it never leaks across sessions/devices and is automatically pruned by TTL.
 *
 * Design mirrors lib/feed/feedSurfaceState.ts and lib/feed/home-feed-return-cache.ts
 * so all surfaces reason about revisit performance the same way.
 */

const STORAGE_KEY = 'hc_swr_cache_v1';
/** Instant-show window: within this age the cache is considered fresh (no refetch needed). */
export const SWR_FRESH_MS = 45 * 1000;
/** Hard TTL: older than this and the entry is dropped (cache miss). */
const SWR_MAX_AGE_MS = 30 * 60 * 1000;
const MAX_JSON_CHARS = 60_000;

type Envelope<T> = {
  savedAt: number;
  payload: T;
};

function readAll(): Record<string, Envelope<unknown>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Envelope<unknown>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, Envelope<unknown>>): void {
  if (typeof window === 'undefined') return;
  try {
    const s = JSON.stringify(data);
    if (s.length > MAX_JSON_CHARS * 2) return;
    window.sessionStorage.setItem(STORAGE_KEY, s);
  } catch {
    /* quota / private mode — never throw */
  }
}

function prune(
  data: Record<string, Envelope<unknown>>,
): Record<string, Envelope<unknown>> {
  const now = Date.now();
  const out: Record<string, Envelope<unknown>> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!v || typeof v !== 'object') continue;
    const at = (v as Envelope<unknown>).savedAt;
    if (typeof at !== 'number' || now - at > SWR_MAX_AGE_MS) continue;
    out[k] = v;
  }
  return out;
}

export type SwrCacheEntry<T> = {
  payload: T;
  savedAt: number;
  /** true when older than SWR_FRESH_MS — caller should show it AND refresh in background. */
  isStale: boolean;
};

export function readSwrCache<T>(key: string): SwrCacheEntry<T> | null {
  if (typeof window === 'undefined' || !key) return null;
  try {
    const all = prune(readAll());
    const row = all[key] as Envelope<T> | undefined;
    if (!row || typeof row.savedAt !== 'number') return null;
    return {
      payload: row.payload,
      savedAt: row.savedAt,
      isStale: Date.now() - row.savedAt > SWR_FRESH_MS,
    };
  } catch {
    return null;
  }
}

export function writeSwrCache<T>(key: string, payload: T): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const all = prune(readAll());
    const next: Envelope<T> = { savedAt: Date.now(), payload };
    const trial = JSON.stringify({ ...all, [key]: next });
    if (trial.length > MAX_JSON_CHARS) {
      // Payload too big for the shared budget — drop just this key, keep others.
      delete all[key];
      writeAll(all);
      return;
    }
    writeAll({ ...all, [key]: next });
  } catch {
    /* ignore */
  }
}

export function clearSwrCache(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const all = prune(readAll());
    delete all[key];
    writeAll(all);
  } catch {
    /* ignore */
  }
}
