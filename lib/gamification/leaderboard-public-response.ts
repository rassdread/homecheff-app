import type { ScopedLeaderboardMeta } from '@/lib/gamification/leaderboard-scoped';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';

/** Client-safe leaderboard meta: geen exacte anchor-coördinaten (privacy). */
export type PublicScopedLeaderboardMeta = Omit<ScopedLeaderboardMeta, 'anchorLat' | 'anchorLng'>;

export type PublicLeaderboardResponse = {
  rows: LeaderboardRow[];
  /** Legacy veldnaam; zelfde als `currentUserRank` wanneer ingelogd. */
  me?: { rank: number | null; score: number };
  currentUserRank: number | null;
  currentUserScore: number;
  meta: PublicScopedLeaderboardMeta;
};

export function toPublicLeaderboardResponse(payload: {
  rows: LeaderboardRow[];
  me?: { rank: number | null; score: number };
  meta: ScopedLeaderboardMeta;
}): PublicLeaderboardResponse {
  const metaRaw = { ...(payload.meta as unknown as Record<string, unknown>) };
  delete metaRaw.anchorLat;
  delete metaRaw.anchorLng;
  const meta = metaRaw as unknown as PublicScopedLeaderboardMeta;
  const rank = payload.me?.rank ?? null;
  const score = payload.me?.score ?? 0;
  return {
    rows: payload.rows,
    me: payload.me,
    currentUserRank: rank,
    currentUserScore: score,
    meta,
  };
}
