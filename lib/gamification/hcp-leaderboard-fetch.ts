import type { PublicLeaderboardResponse } from '@/lib/gamification/leaderboard-public-response';
import type { LeaderboardPeriodParam, LeaderboardScope } from '@/lib/gamification/leaderboard-scoped';

export type HcpLeaderboardFetchParams = {
  scope: LeaderboardScope;
  period: LeaderboardPeriodParam;
  radiusKm?: 10 | 25 | 50 | 100;
  gpsPos?: { lat: number; lng: number } | null;
  /** Land (ISO2), o.a. voor gast-weergave op `scope=country`. */
  countryCode?: string | null;
  /** 1–50; server default 50. Kleinere waarde = lichtere payload (preview). */
  limit?: number;
};

/** Bouwt dezelfde querystring als `HcpRanglijstenClient` / compacte Mijn HCP-preview. */
export function buildHcpLeaderboardQueryString(p: HcpLeaderboardFetchParams): string {
  const params = new URLSearchParams({
    scope: p.scope,
    period: p.period,
  });
  if (p.limit != null && Number.isFinite(p.limit)) {
    const n = Math.min(50, Math.max(1, Math.floor(p.limit)));
    params.set('limit', String(n));
  }
  if (p.scope === 'nearby') {
    params.set('radiusKm', String(p.radiusKm ?? 50));
    if (p.gpsPos) {
      params.set('lat', String(p.gpsPos.lat));
      params.set('lng', String(p.gpsPos.lng));
    }
  }
  if (p.scope === 'country' && p.countryCode?.trim()) {
    params.set('country', p.countryCode.trim().toUpperCase());
  }
  return params.toString();
}

export async function fetchHcpLeaderboardScoped(
  p: HcpLeaderboardFetchParams,
  signal?: AbortSignal
): Promise<PublicLeaderboardResponse> {
  const qs = buildHcpLeaderboardQueryString(p);
  const res = await fetch(`/api/gamification/leaderboard?${qs}`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) throw new Error('leaderboard');
  return (await res.json()) as PublicLeaderboardResponse;
}
