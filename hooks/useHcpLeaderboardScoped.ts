'use client';

import { useEffect, useState } from 'react';
import type { PublicLeaderboardResponse } from '@/lib/gamification/leaderboard-public-response';
import {
  fetchHcpLeaderboardScoped,
  type HcpLeaderboardFetchParams,
} from '@/lib/gamification/hcp-leaderboard-fetch';

/**
 * Zelfde bron als `/hcp-ranglijsten`: GET `/api/gamification/leaderboard` met scope/period/limit.
 */
export function useHcpLeaderboardScoped(params: HcpLeaderboardFetchParams) {
  const [data, setData] = useState<PublicLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { scope, period, radiusKm, gpsPos, limit, countryCode } = params;

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    fetchHcpLeaderboardScoped(
      { scope, period, radiusKm, gpsPos, limit, countryCode },
      ac.signal
    )
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [scope, period, radiusKm, gpsPos?.lat, gpsPos?.lng, limit, countryCode]);

  return { data, loading };
}
