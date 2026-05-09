import { prisma } from '@/lib/prisma';
import { hcpLevelFromTotal } from '@/lib/gamification/hcp-level';
import {
  buildRowsFromUserIds,
  mondayStartUtc,
  monthStartUtc,
  yearStartUtc,
  type LeaderboardRow,
} from '@/lib/gamification/leaderboard-queries';
import { hcpIsoWeekKeyUtc } from '@/lib/gamification/weekly-challenges';

export type LeaderboardScope = 'nearby' | 'country' | 'worldwide';
export type LeaderboardPeriodParam = 'week' | 'month' | 'year' | 'all';

export type LocationSource = 'gps' | 'profile' | 'fallback';

export type ScopedLeaderboardMeta = {
  scope: LeaderboardScope;
  period: LeaderboardPeriodParam;
  radiusKm?: number;
  locationSource?: LocationSource;
  anchorLat?: number | null;
  anchorLng?: number | null;
  countryCode?: string | null;
  hint?: string;
  weekKey: string;
  weekStartUtc: string;
  monthStartUtc: string;
  yearStartUtc: string;
};

/** Grote-cirkel afstand in km (WGS84). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
}

function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusKm / (111 * Math.max(Math.abs(cosLat), 0.05));
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}

async function nearbyUserIds(anchorLat: number, anchorLng: number, radiusKm: number): Promise<string[]> {
  const box = boundingBox(anchorLat, anchorLng, radiusKm);
  const users = await prisma.user.findMany({
    where: {
      lat: { not: null, gte: box.latMin, lte: box.latMax },
      lng: { not: null, gte: box.lngMin, lte: box.lngMax },
    },
    select: { id: true, lat: true, lng: true },
    take: 5000,
  });
  return users
    .filter(
      (u) =>
        u.lat != null &&
        u.lng != null &&
        haversineKm(anchorLat, anchorLng, u.lat, u.lng) <= radiusKm + 0.001
    )
    .map((u) => u.id);
}

/** Nearby only — `candidateIds` verplicht (niet leeg). */
async function scoresForNearbyPeriod(
  candidateIds: string[],
  period: LeaderboardPeriodParam,
  weekStart: Date,
  monthStart: Date,
  yearStart: Date
): Promise<Map<string, number>> {
  if (candidateIds.length === 0) return new Map();

  if (period === 'week') {
    const groups = await prisma.hcpEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { in: candidateIds },
        createdAt: { gte: weekStart },
      },
      _sum: { points: true },
    });
    return new Map(groups.map((g) => [g.userId, g._sum.points ?? 0]));
  }

  if (period === 'month') {
    const groups = await prisma.hcpEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { in: candidateIds },
        createdAt: { gte: monthStart },
      },
      _sum: { points: true },
    });
    return new Map(groups.map((g) => [g.userId, g._sum.points ?? 0]));
  }

  if (period === 'year') {
    const groups = await prisma.hcpEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { in: candidateIds },
        createdAt: { gte: yearStart },
      },
      _sum: { points: true },
    });
    return new Map(groups.map((g) => [g.userId, g._sum.points ?? 0]));
  }

  const stats = await prisma.userHcpStats.findMany({
    where: { userId: { in: candidateIds } },
    select: { userId: true, totalHcp: true },
  });
  return new Map(stats.map((s) => [s.userId, s.totalHcp]));
}

async function scoresWorldwidePeriod(
  period: LeaderboardPeriodParam,
  weekStart: Date,
  monthStart: Date,
  yearStart: Date
): Promise<Map<string, number>> {
  if (period === 'week') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      WHERE he."createdAt" >= ${weekStart}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  if (period === 'month') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      WHERE he."createdAt" >= ${monthStart}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  if (period === 'year') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      WHERE he."createdAt" >= ${yearStart}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
    SELECT "userId", "totalHcp"::bigint AS score
    FROM "UserHcpStats"
    WHERE "totalHcp" > 0
    ORDER BY "totalHcp" DESC
    LIMIT 600
  `;
  return new Map(rows.map((r) => [r.userId, Number(r.score)]));
}

async function mergeViewerScoreIfMissing(
  userId: string,
  scores: Map<string, number>,
  period: LeaderboardPeriodParam,
  weekStart: Date,
  monthStart: Date,
  yearStart: Date
): Promise<void> {
  if (scores.has(userId)) return;
  if (period === 'week') {
    const a = await prisma.hcpEvent.aggregate({
      where: { userId, createdAt: { gte: weekStart } },
      _sum: { points: true },
    });
    const s = a._sum.points ?? 0;
    if (s > 0) scores.set(userId, s);
    return;
  }
  if (period === 'month') {
    const a = await prisma.hcpEvent.aggregate({
      where: { userId, createdAt: { gte: monthStart } },
      _sum: { points: true },
    });
    const s = a._sum.points ?? 0;
    if (s > 0) scores.set(userId, s);
    return;
  }
  if (period === 'year') {
    const a = await prisma.hcpEvent.aggregate({
      where: { userId, createdAt: { gte: yearStart } },
      _sum: { points: true },
    });
    const s = a._sum.points ?? 0;
    if (s > 0) scores.set(userId, s);
    return;
  }
  const st = await prisma.userHcpStats.findUnique({
    where: { userId },
    select: { totalHcp: true },
  });
  const s = st?.totalHcp ?? 0;
  if (s > 0) scores.set(userId, s);
}

async function scoresCountryPeriod(
  countryCode: string,
  period: LeaderboardPeriodParam,
  weekStart: Date,
  monthStart: Date,
  yearStart: Date
): Promise<Map<string, number>> {
  if (period === 'week') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      INNER JOIN "User" u ON u.id = he."userId"
      WHERE he."createdAt" >= ${weekStart}
        AND u.country = ${countryCode}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  if (period === 'month') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      INNER JOIN "User" u ON u.id = he."userId"
      WHERE he."createdAt" >= ${monthStart}
        AND u.country = ${countryCode}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  if (period === 'year') {
    const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
      SELECT he."userId", SUM(he.points)::bigint AS score
      FROM "HcpEvent" he
      INNER JOIN "User" u ON u.id = he."userId"
      WHERE he."createdAt" >= ${yearStart}
        AND u.country = ${countryCode}
      GROUP BY he."userId"
      HAVING SUM(he.points) > 0
      ORDER BY score DESC
      LIMIT 600
    `;
    return new Map(rows.map((r) => [r.userId, Number(r.score)]));
  }
  const rows = await prisma.$queryRaw<Array<{ userId: string; score: bigint }>>`
    SELECT s."userId", s."totalHcp"::bigint AS score
    FROM "UserHcpStats" s
    INNER JOIN "User" u ON u.id = s."userId"
    WHERE u.country = ${countryCode}
      AND s."totalHcp" > 0
    ORDER BY s."totalHcp" DESC
    LIMIT 600
  `;
  return new Map(rows.map((r) => [r.userId, Number(r.score)]));
}

function sortIdsByScore(scores: Map<string, number>): string[] {
  return [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => {
      const d = b[1] - a[1];
      if (d !== 0) return d;
      return a[0].localeCompare(b[0]);
    })
    .map(([id]) => id);
}

async function loadLevelsFor(userIds: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();
  const stats = await prisma.userHcpStats.findMany({
    where: { userId: { in: unique } },
    select: { userId: true, totalHcp: true },
  });
  return new Map(stats.map((s) => [s.userId, hcpLevelFromTotal(s.totalHcp)]));
}

async function buildLeaderboardRowsWithViewer(
  sortedIds: string[],
  scores: Map<string, number>,
  take: number,
  viewerId: string | null | undefined,
  includeBadges: boolean
): Promise<LeaderboardRow[]> {
  const topIds = sortedIds.slice(0, take);
  const levelMap = await loadLevelsFor(
    viewerId && !topIds.includes(viewerId) ? [...topIds, viewerId] : topIds
  );
  const levelFor = (uid: string) => levelMap.get(uid) ?? 1;

  let rows = await buildRowsFromUserIds(
    topIds,
    (uid) => scores.get(uid) ?? 0,
    levelFor,
    take,
    viewerId,
    { includeBadges }
  );

  if (viewerId && !topIds.includes(viewerId)) {
    const score = scores.get(viewerId) ?? 0;
    if (score > 0) {
      const rank = sortedIds.findIndex((id) => id === viewerId);
      if (rank >= 0) {
        const extra = await buildRowsFromUserIds(
          [viewerId],
          (uid) => scores.get(uid) ?? 0,
          levelFor,
          1,
          viewerId,
          { includeBadges }
        );
        if (extra[0]) {
          extra[0].rank = rank + 1;
          rows = [...rows, extra[0]];
        }
      }
    }
  }

  return rows;
}

/** Leaderboard voor nearby / land / wereld + week / maand / algemeen. */
export async function getScopedLeaderboardPayload(opts: {
  take?: number;
  currentUserId?: string | null;
  scope: LeaderboardScope;
  period: LeaderboardPeriodParam;
  radiusKm?: number;
  lat?: number | null;
  lng?: number | null;
  country?: string | null;
  viewerProfile?: { lat: number | null; lng: number | null; country: string | null } | null;
  /** Default true; set false for lightweight widgets (homepage carousel). */
  includeBadges?: boolean;
}): Promise<{
  rows: LeaderboardRow[];
  me?: { rank: number | null; score: number };
  meta: ScopedLeaderboardMeta;
}> {
  const take = Math.min(Math.max(opts.take ?? 50, 1), 50);
  const includeBadges = opts.includeBadges !== false;
  const now = new Date();
  const weekStart = mondayStartUtc(now);
  const monthStart = monthStartUtc(now);
  const yearStart = yearStartUtc(now);
  const weekKey = hcpIsoWeekKeyUtc();

  const baseMeta: ScopedLeaderboardMeta = {
    scope: opts.scope,
    period: opts.period,
    weekKey,
    weekStartUtc: weekStart.toISOString(),
    monthStartUtc: monthStart.toISOString(),
    yearStartUtc: yearStart.toISOString(),
  };

  let candidateIds: string[] | null = null;
  let locationSource: LocationSource | undefined;
  let anchorLat: number | null | undefined;
  let anchorLng: number | null | undefined;
  let countryCode: string | null | undefined;
  let hint: string | undefined;
  let radiusKm = opts.radiusKm ?? 50;

  if (opts.scope === 'nearby') {
    const gpsLat = opts.lat != null && Number.isFinite(opts.lat) ? opts.lat : null;
    const gpsLng = opts.lng != null && Number.isFinite(opts.lng) ? opts.lng : null;
    const profLat = opts.viewerProfile?.lat ?? null;
    const profLng = opts.viewerProfile?.lng ?? null;

    if (gpsLat != null && gpsLng != null) {
      anchorLat = gpsLat;
      anchorLng = gpsLng;
      locationSource = 'gps';
    } else if (profLat != null && profLng != null) {
      anchorLat = profLat;
      anchorLng = profLng;
      locationSource = 'profile';
    } else {
      locationSource = 'fallback';
      hint =
        'Voeg je locatie toe om de ranglijst in je buurt te zien.';
      return {
        rows: [],
        me: opts.currentUserId ? { rank: null, score: 0 } : undefined,
        meta: {
          ...baseMeta,
          radiusKm,
          locationSource,
          hint,
        },
      };
    }

    candidateIds = await nearbyUserIds(anchorLat!, anchorLng!, radiusKm);
    if (opts.currentUserId && anchorLat != null && anchorLng != null) {
      const u = await prisma.user.findUnique({
        where: { id: opts.currentUserId },
        select: { lat: true, lng: true },
      });
      if (
        u?.lat != null &&
        u?.lng != null &&
        haversineKm(anchorLat, anchorLng, u.lat, u.lng) <= radiusKm + 0.001
      ) {
        candidateIds = [...new Set([...candidateIds, opts.currentUserId])];
      }
    }
    if (candidateIds.length === 0) {
      hint = 'Nog geen makers met locatie in deze straal.';
    }
  } else if (opts.scope === 'country') {
    countryCode = (opts.country ?? opts.viewerProfile?.country ?? 'NL').trim() || 'NL';
    locationSource = 'profile';
  } else {
    candidateIds = null;
  }

  let scores: Map<string, number>;
  if (opts.scope === 'country' && countryCode) {
    scores = await scoresCountryPeriod(countryCode, opts.period, weekStart, monthStart, yearStart);
  } else if (opts.scope === 'worldwide') {
    scores = await scoresWorldwidePeriod(opts.period, weekStart, monthStart, yearStart);
  } else {
    scores = await scoresForNearbyPeriod(candidateIds ?? [], opts.period, weekStart, monthStart, yearStart);
  }

  if (opts.currentUserId) {
    await mergeViewerScoreIfMissing(
      opts.currentUserId,
      scores,
      opts.period,
      weekStart,
      monthStart,
      yearStart
    );
  }

  const sortedIds = sortIdsByScore(scores);
  const rows = await buildLeaderboardRowsWithViewer(
    sortedIds,
    scores,
    take,
    opts.currentUserId ?? null,
    includeBadges
  );

  let me: { rank: number | null; score: number } | undefined;
  const uid = opts.currentUserId;
  if (uid) {
    const score = scores.get(uid) ?? 0;
    if (score <= 0) {
      me = { rank: null, score: 0 };
    } else {
      const idx = sortedIds.indexOf(uid);
      me = { rank: idx >= 0 ? idx + 1 : null, score };
    }
  }

  return {
    rows,
    me,
    meta: {
      ...baseMeta,
      radiusKm: opts.scope === 'nearby' ? radiusKm : undefined,
      locationSource,
      anchorLat: anchorLat ?? null,
      anchorLng: anchorLng ?? null,
      countryCode: opts.scope === 'country' ? countryCode ?? null : null,
      hint,
    },
  };
}
