'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  readSwrCache,
  writeSwrCache,
  clearSwrCache,
} from '@/lib/runtime/sessionSwrCache';

/**
 * Unified "instant show, background refresh" hook (UX-FIN-4C.2).
 *
 * - On mount: hydrate synchronously from the session cache → no skeleton on revisit.
 * - If cache is missing → `loading` is true until the first fetch resolves.
 * - If cache exists → `loading` is false immediately; a background refresh runs
 *   only when the cache is stale (or `alwaysRevalidate`).
 * - The fetcher result replaces state calmly (no unmount, no flicker) and is
 *   written back to the cache for the next revisit.
 *
 * Enabled/disabled via `enabled` (e.g. gate on auth). Disabling never clears cache.
 */
export type UseSessionSwrResult<T> = {
  data: T | null;
  /** True only when there is no cached data yet and a fetch is in flight. */
  loading: boolean;
  /** True while a background refresh is running over already-visible data. */
  refreshing: boolean;
  error: unknown;
  /** Manual refresh (e.g. after a mutation). Runs in background if data exists. */
  refresh: () => Promise<void>;
  /** Optimistically replace data locally and persist it to the cache. */
  mutate: (next: T | ((prev: T | null) => T)) => void;
};

export function useSessionSwr<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: { enabled?: boolean; alwaysRevalidate?: boolean },
): UseSessionSwrResult<T> {
  const enabled = options?.enabled ?? true;
  const alwaysRevalidate = options?.alwaysRevalidate ?? true;

  const cached = key ? readSwrCache<T>(key) : null;
  const [data, setData] = useState<T | null>(cached?.payload ?? null);
  const [loading, setLoading] = useState<boolean>(enabled && !cached);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const inFlightRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (hasVisibleData: boolean) => {
      if (!key || !enabled) return;
      inFlightRef.current?.abort();
      const ac = new AbortController();
      inFlightRef.current = ac;
      if (hasVisibleData) setRefreshing(true);
      else setLoading(true);
      try {
        const next = await fetcherRef.current(ac.signal);
        if (ac.signal.aborted) return;
        setData(next);
        writeSwrCache(key, next);
        setError(null);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        setError(e);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [key, enabled],
  );

  useEffect(() => {
    if (!enabled || !key) return;
    const entry = readSwrCache<T>(key);
    if (entry) {
      // Instant show; refresh in background only when stale (or forced).
      setData(entry.payload);
      setLoading(false);
      if (entry.isStale || alwaysRevalidate) void run(true);
    } else {
      void run(false);
    }
    return () => {
      inFlightRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const refresh = useCallback(async () => {
    await run(data != null);
  }, [run, data]);

  const mutate = useCallback(
    (next: T | ((prev: T | null) => T)) => {
      setData((prev) => {
        const value =
          typeof next === 'function'
            ? (next as (p: T | null) => T)(prev)
            : next;
        if (key) writeSwrCache(key, value);
        return value;
      });
    },
    [key],
  );

  return { data, loading, refreshing, error, refresh, mutate };
}

export { clearSwrCache };
