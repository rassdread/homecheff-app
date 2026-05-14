import { prisma } from '@/lib/prisma';
import { getDisplayName } from '@/lib/displayName';
import { hcpLevelFromTotal } from '@/lib/gamification/hcp-level';
import { fetchAuthorBadgeSummariesByUserIds, type AuthorBadgeChip } from '@/lib/gamification/author-badge-summaries';
import { hcpIsoWeekKeyUtc } from '@/lib/gamification/weekly-challenges';
import { publicLeaderboardProfileHref } from '@/lib/user/public-profile';

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatar: string | null;
  level: number;
  score: number;
  badgeSummaries: AuthorBadgeChip[];
  isCurrentUser: boolean;
  /** Server: alleen gezet als `showProfileToEveryone`; anders `null` (geen klik). */
  publicProfileHref: string | null;
};

export function mondayStartUtc(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function monthStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** Calendar year start (UTC), for yearly period leaderboards. */
export function yearStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

async function usersForIds(ids: string[]) {
  if (ids.length === 0)
    return new Map<
      string,
      {
        name: string | null;
        username: string | null;
        image: string | null;
        profileImage: string | null;
        showProfileToEveryone: boolean;
        displayFullName: boolean | null;
        displayNameOption: string | null;
      }
    >();
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      profileImage: true,
      showProfileToEveryone: true,
      displayFullName: true,
      displayNameOption: true,
    },
  });
  return new Map(users.map((u) => [u.id, u]));
}

function avatarFor(u: { image: string | null; profileImage: string | null } | undefined): string | null {
  if (!u) return null;
  return u.profileImage || u.image || null;
}

/** Rank within a period: 1 = highest points (ties: stable sort by userId). */
export function periodRankFromGroups(
  groups: Array<{ userId: string; _sum: { points: number | null } }>,
  myUserId: string
): number | null {
  const mine = groups.find((g) => g.userId === myUserId)?._sum.points ?? 0;
  if (mine <= 0) return null;
  const sorted = [...groups]
    .filter((g) => (g._sum.points ?? 0) > 0)
    .sort((a, b) => {
      const db = (b._sum.points ?? 0) - (a._sum.points ?? 0);
      if (db !== 0) return db;
      return a.userId.localeCompare(b.userId);
    });
  const idx = sorted.findIndex((g) => g.userId === myUserId);
  return idx >= 0 ? idx + 1 : null;
}

export async function buildRowsFromUserIds(
  orderedUserIds: string[],
  scoreFn: (userId: string) => number,
  levelFn: (userId: string) => number,
  take: number,
  viewerId: string | null | undefined,
  options?: { includeBadges?: boolean }
): Promise<LeaderboardRow[]> {
  const slice = orderedUserIds.slice(0, take);
  const users = await usersForIds(slice);
  const includeBadges = options?.includeBadges !== false;
  const badges = includeBadges
    ? await fetchAuthorBadgeSummariesByUserIds(slice, 2)
    : new Map<string, AuthorBadgeChip[]>();
  return slice.map((userId, i) => {
    const u = users.get(userId);
    const profilePublic = u?.showProfileToEveryone === true;
    return {
      rank: i + 1,
      userId,
      displayName: getDisplayName(u),
      username: u?.username ?? null,
      avatar: avatarFor(u),
      level: levelFn(userId),
      score: scoreFn(userId),
      badgeSummaries: badges.get(userId) ?? [],
      isCurrentUser: Boolean(viewerId && viewerId === userId),
      publicProfileHref: publicLeaderboardProfileHref(userId, u?.username ?? null, profilePublic),
    };
  });
}

export async function getLeaderboardPayload(opts: { take?: number; currentUserId?: string | null }) {
  const take = Math.min(Math.max(opts.take ?? 20, 1), 50);
  const now = new Date();
  const weekStart = mondayStartUtc(now);
  const monthStart = monthStartUtc(now);

  const [allTimeStats, weeklyGroups, monthlyGroups] = await Promise.all([
    prisma.userHcpStats.findMany({
      orderBy: { totalHcp: 'desc' },
      take,
      select: { userId: true, totalHcp: true },
    }),
    prisma.hcpEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekStart } },
      _sum: { points: true },
    }),
    prisma.hcpEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart } },
      _sum: { points: true },
    }),
  ]);

  const weeklySorted = [...weeklyGroups]
    .filter((g) => (g._sum.points ?? 0) > 0)
    .sort((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0))
    .map((g) => g.userId);

  const monthlySorted = [...monthlyGroups]
    .filter((g) => (g._sum.points ?? 0) > 0)
    .sort((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0))
    .map((g) => g.userId);

  const weeklyScore = new Map(weeklyGroups.map((g) => [g.userId, g._sum.points ?? 0]));
  const monthlyScore = new Map(monthlyGroups.map((g) => [g.userId, g._sum.points ?? 0]));

  const allTimeTotal = new Map(allTimeStats.map((s) => [s.userId, s.totalHcp]));

  const allTimeUserIds = allTimeStats.map((s) => s.userId);
  const extraForLevels = [...new Set([...weeklySorted, ...monthlySorted])].filter(
    (id) => !allTimeTotal.has(id)
  );
  const statsForLevels =
    extraForLevels.length > 0
      ? await prisma.userHcpStats.findMany({
          where: { userId: { in: extraForLevels } },
          select: { userId: true, totalHcp: true },
        })
      : [];
  for (const s of statsForLevels) {
    allTimeTotal.set(s.userId, s.totalHcp);
  }

  const levelFor = (userId: string) => hcpLevelFromTotal(allTimeTotal.get(userId) ?? 0);

  const viewer = opts.currentUserId ?? null;

  const [allTime, weekly, monthly] = await Promise.all([
    buildRowsFromUserIds(
      allTimeUserIds,
      (uid) => allTimeStats.find((s) => s.userId === uid)?.totalHcp ?? 0,
      levelFor,
      take,
      viewer
    ),
    buildRowsFromUserIds(
      weeklySorted,
      (uid) => weeklyScore.get(uid) ?? 0,
      levelFor,
      take,
      viewer
    ),
    buildRowsFromUserIds(
      monthlySorted,
      (uid) => monthlyScore.get(uid) ?? 0,
      levelFor,
      take,
      viewer
    ),
  ]);

  let me: { allTimeRank: number | null; weeklyRank: number | null; monthlyRank: number | null } | undefined;
  const uid = opts.currentUserId;
  if (uid) {
    const myStats = await prisma.userHcpStats.findUnique({
      where: { userId: uid },
      select: { totalHcp: true },
    });
    const myTotal = myStats?.totalHcp ?? 0;
    const higherAllTime = await prisma.userHcpStats.count({
      where: { totalHcp: { gt: myTotal } },
    });

    me = {
      allTimeRank: higherAllTime + 1,
      weeklyRank: periodRankFromGroups(weeklyGroups, uid),
      monthlyRank: periodRankFromGroups(monthlyGroups, uid),
    };
  }

  return {
    allTime,
    weekly,
    monthly,
    me,
    meta: {
      weekKey: hcpIsoWeekKeyUtc(),
      weekStartUtc: weekStart.toISOString(),
      monthStartUtc: monthStart.toISOString(),
    },
  };
}
