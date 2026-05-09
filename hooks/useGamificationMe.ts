'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { GamificationMeResponse } from '@/lib/gamification/gamification-me-types';

export type GamificationMeData = GamificationMeResponse;

type CacheEntry = {
  userId: string;
  data: GamificationMeResponse | null;
  promise: Promise<GamificationMeResponse | null> | null;
  /** After the first attempt for `userId` finishes (success or failure). */
  settled: boolean;
};

let cache: CacheEntry | null = null;

function resetCache() {
  cache = null;
}

async function fetchGamificationMe(): Promise<GamificationMeResponse | null> {
  const res = await fetch('/api/gamification/me', { credentials: 'include' });
  if (!res.ok) return null;
  return (await res.json()) as GamificationMeResponse;
}

/**
 * Deduped session fetch for `/api/gamification/me` (daily-login side effect runs once per cache fill).
 * Multiple mounted consumers share one in-flight request and cached result until logout or `refetch`.
 */
export function useGamificationMe() {
  const { data: session, status } = useSession();
  const userId = useMemo(
    () => (session?.user as { id?: string } | undefined)?.id ?? null,
    [session?.user]
  );

  const [data, setData] = useState<GamificationMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((): Promise<GamificationMeResponse | null> => {
    if (!userId) return Promise.resolve(null);
    resetCache();
    cache = { userId, data: null, promise: null, settled: false };
    setLoading(true);
    setError(null);
    const p = fetchGamificationMe();
    cache.promise = p;
    return p
      .then((d) => {
        if (cache?.userId === userId) {
          cache.data = d;
          cache.promise = null;
          cache.settled = true;
          setData(d);
        }
        setLoading(false);
        return d;
      })
      .catch(() => {
        setError('Kon HomeCheff Points niet laden');
        setData(null);
        setLoading(false);
        if (cache?.userId === userId) {
          cache.settled = true;
          cache.promise = null;
        }
        return null;
      });
  }, [userId]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !userId) {
      resetCache();
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!cache || cache.userId !== userId) {
      cache = { userId, data: null, promise: null, settled: false };
    }

    if (cache.settled && cache.userId === userId) {
      setData(cache.data);
      setLoading(false);
      setError(null);
      return;
    }

    if (cache.promise) {
      setLoading(true);
      void cache.promise
        .then((d) => {
          if (cache?.userId === userId) setData(d);
          setLoading(false);
        })
        .catch(() => {
          setError('Kon HomeCheff Points niet laden');
          setLoading(false);
        });
      return;
    }

    setLoading(true);
    setError(null);
    const p = fetchGamificationMe();
    cache.promise = p;
    void p
      .then((d) => {
        if (cache?.userId === userId) {
          cache.data = d;
          cache.promise = null;
          cache.settled = true;
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Kon HomeCheff Points niet laden');
        setData(null);
        setLoading(false);
        if (cache?.userId === userId) {
          cache.settled = true;
          cache.promise = null;
        }
      });
  }, [status, userId]);

  return { data, loading, error, refetch };
}
