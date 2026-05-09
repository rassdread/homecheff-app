'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

export type GamificationMeData = {
  totalHcp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  nextLevelHcp: number;
  hcpToNextLevel: number;
  recentEvents: Array<{
    id: string;
    action: string;
    points: number;
    createdAt: string;
  }>;
  badges: Array<{
    slug: string;
    name: string;
    description?: string | null;
    iconKey?: string | null;
    awardedAt: string;
  }>;
};

type CacheEntry = {
  userId: string;
  data: GamificationMeData | null;
  promise: Promise<GamificationMeData | null> | null;
  /** After the first attempt for `userId` finishes (success or failure). */
  settled: boolean;
};

let cache: CacheEntry | null = null;

function resetCache() {
  cache = null;
}

async function fetchGamificationMe(): Promise<GamificationMeData | null> {
  const res = await fetch('/api/gamification/me', { credentials: 'include' });
  if (!res.ok) return null;
  return (await res.json()) as GamificationMeData;
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

  const [data, setData] = useState<GamificationMeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!userId) return;
    resetCache();
    cache = { userId, data: null, promise: null, settled: false };
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
