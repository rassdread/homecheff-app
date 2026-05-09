import { HcpRewardStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getScopedLeaderboardPayload } from '@/lib/gamification/leaderboard-scoped';
import { HCP_REWARD_SLUGS } from '@/lib/gamification/hcp-rewards-engine';
import { mondayStartUtc } from '@/lib/gamification/leaderboard-queries';

export type AdminSlideLifecycle = 'active' | 'scheduled' | 'expired' | 'inactive';

export type AdminHcpSlideRow = {
  id: string;
  title: string;
  slideType: string;
  placement: string;
  targetType: string;
  targetCountry: string | null;
  targetRadiusKm: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  lifecycle: AdminSlideLifecycle;
};

export type AdminHcpRewardInsightRow = {
  slug: string;
  title: string;
  trigger: string;
  eligibleUsers: number;
  activeGrants: number;
  statusNote: string;
  lastEvaluatedAt: string | null;
};

export type AdminHcpLbRow = {
  rank: number;
  displayName: string;
  username: string | null;
  score: number;
};

export type AdminHcpOverviewData = {
  generatedAt: string;
  slides: AdminHcpSlideRow[];
  promoSlides: AdminHcpSlideRow[];
  lifecycleCounts: Record<AdminSlideLifecycle, number>;
  placementActivePromo: { HOME: number; RANKINGS: number; BOTH: number };
  targetingActivePromo: { GLOBAL: number; COUNTRY: number; RADIUS: number };
  totalActiveGrants: number;
  usersWithActiveGrant: number;
  rewardRows: AdminHcpRewardInsightRow[];
  lastRewardDbTouch: string | null;
  leaderboards: {
    week: AdminHcpLbRow[];
    month: AdminHcpLbRow[];
    year: AdminHcpLbRow[];
  };
  featuredWeek: AdminHcpLbRow | null;
};

export function classifyAdminSlide(
  now: Date,
  s: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }
): AdminSlideLifecycle {
  if (s.endsAt && s.endsAt < now) return 'expired';
  if (s.isActive && s.startsAt && s.startsAt > now) return 'scheduled';
  if (!s.isActive) return 'inactive';
  const started = !s.startsAt || s.startsAt <= now;
  const notEnded = !s.endsAt || s.endsAt >= now;
  if (started && notEnded) return 'active';
  return 'inactive';
}

function isPromoLike(slideType: string) {
  return slideType === 'PROMO' || slideType === 'SPONSORED';
}

async function countWeeklyTopEligible(): Promise<number> {
  const weekStart = mondayStartUtc();
  const weeklyGroups = await prisma.hcpEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: weekStart } },
    _sum: { points: true },
  });
  const sorted = [...weeklyGroups]
    .filter((g) => (g._sum.points ?? 0) > 0)
    .sort((a, b) => {
      const db = (b._sum.points ?? 0) - (a._sum.points ?? 0);
      if (db !== 0) return db;
      return a.userId.localeCompare(b.userId);
    });
  return Math.min(3, sorted.length);
}

async function countActiveGrantsForSlug(slug: string, now: Date): Promise<number> {
  return prisma.userHcpReward.count({
    where: {
      slug,
      status: HcpRewardStatus.ACTIVE,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

function serializeLb(rows: Awaited<ReturnType<typeof getScopedLeaderboardPayload>>['rows']): AdminHcpLbRow[] {
  return rows.map((r) => ({
    rank: r.rank,
    displayName: r.displayName,
    username: r.username,
    score: r.score,
  }));
}

/**
 * Geaggregeerde HCP V3 admin-data (promo-slides, rewards, ranglijsten). Geen publieke GPS-coördinaten.
 */
export async function loadAdminHcpOverview(): Promise<AdminHcpOverviewData> {
  const now = new Date();
  const slidesRaw = await prisma.hcpCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const slides: AdminHcpSlideRow[] = slidesRaw.map((s) => ({
    id: s.id,
    title: s.title,
    slideType: s.slideType,
    placement: s.placement ?? 'BOTH',
    targetType: s.targetType ?? 'GLOBAL',
    targetCountry: s.targetCountry ?? null,
    targetRadiusKm: s.targetRadiusKm ?? null,
    isActive: s.isActive,
    startsAt: s.startsAt ? s.startsAt.toISOString() : null,
    endsAt: s.endsAt ? s.endsAt.toISOString() : null,
    ctaLabel: s.ctaLabel ?? null,
    ctaUrl: s.ctaUrl ?? null,
    lifecycle: classifyAdminSlide(now, s),
  }));

  const promoSlides = slides.filter((s) => isPromoLike(s.slideType));

  const lifecycleCounts: Record<AdminSlideLifecycle, number> = {
    active: 0,
    scheduled: 0,
    expired: 0,
    inactive: 0,
  };
  for (const s of slides) {
    lifecycleCounts[s.lifecycle]++;
  }

  const placementActivePromo = { HOME: 0, RANKINGS: 0, BOTH: 0 };
  const targetingActivePromo = { GLOBAL: 0, COUNTRY: 0, RADIUS: 0 };
  for (const s of promoSlides) {
    if (s.lifecycle !== 'active') continue;
    if (s.placement === 'HOME') placementActivePromo.HOME++;
    else if (s.placement === 'RANKINGS') placementActivePromo.RANKINGS++;
    else placementActivePromo.BOTH++;
    const tt = s.targetType as keyof typeof targetingActivePromo;
    if (tt === 'GLOBAL' || tt === 'COUNTRY' || tt === 'RADIUS') targetingActivePromo[tt]++;
  }

  const [
    weekWorld,
    monthWorld,
    yearWorld,
    lastTouchAgg,
    lastBySlug,
    eligibleBoost,
    eligibleFeatured,
    eligibleWeekly,
    eligibleStreak,
    grantsBoost,
    grantsFeatured,
    grantsWeekly,
    grantsStreak,
    distinctUsers,
    grantsTotal,
  ] = await Promise.all([
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: null,
      scope: 'worldwide',
      period: 'week',
      viewerProfile: null,
      includeBadges: false,
    }),
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: null,
      scope: 'worldwide',
      period: 'month',
      viewerProfile: null,
      includeBadges: false,
    }),
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: null,
      scope: 'worldwide',
      period: 'year',
      viewerProfile: null,
      includeBadges: false,
    }),
    prisma.userHcpReward.aggregate({ _max: { updatedAt: true } }),
    prisma.userHcpReward.groupBy({
      by: ['slug'],
      _max: { updatedAt: true },
    }),
    prisma.userHcpStats.count({ where: { totalHcp: { gte: 500 } } }),
    prisma.userHcpStats.count({ where: { totalHcp: { gte: 1000 } } }),
    countWeeklyTopEligible(),
    prisma.userHcpStats.count({
      where: {
        OR: [{ currentStreak: { gte: 30 } }, { longestStreak: { gte: 30 } }],
      },
    }),
    countActiveGrantsForSlug(HCP_REWARD_SLUGS.PROFILE_BOOST_500, now),
    countActiveGrantsForSlug(HCP_REWARD_SLUGS.FEATURED_CREATOR_1000, now),
    countActiveGrantsForSlug(HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3, now),
    countActiveGrantsForSlug(HCP_REWARD_SLUGS.STREAK_GLOW_30, now),
    prisma.userHcpReward.findMany({
      where: {
        status: HcpRewardStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.userHcpReward.count({
      where: {
        status: HcpRewardStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
  ]);

  const slugLast = new Map(lastBySlug.map((r) => [r.slug, r._max.updatedAt]));

  const rewardRows: AdminHcpRewardInsightRow[] = [
    {
      slug: HCP_REWARD_SLUGS.PROFILE_BOOST_500,
      title: 'Profielboost',
      trigger: '≥ 500 HCP totaal (lifetime)',
      eligibleUsers: eligibleBoost,
      activeGrants: grantsBoost,
      statusNote: 'Automatisch server-side na HCP-toekenning en bij GET /api/gamification/me',
      lastEvaluatedAt: slugLast.get(HCP_REWARD_SLUGS.PROFILE_BOOST_500)?.toISOString() ?? null,
    },
    {
      slug: HCP_REWARD_SLUGS.FEATURED_CREATOR_1000,
      title: 'Featured creator',
      trigger: '≥ 1000 HCP totaal (lifetime)',
      eligibleUsers: eligibleFeatured,
      activeGrants: grantsFeatured,
      statusNote: 'Automatisch server-side na HCP-toekenning en bij GET /api/gamification/me',
      lastEvaluatedAt: slugLast.get(HCP_REWARD_SLUGS.FEATURED_CREATOR_1000)?.toISOString() ?? null,
    },
    {
      slug: HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3,
      title: 'Creator van de week (top 3)',
      trigger: 'Top 3 HCP deze UTC-week (rolling)',
      eligibleUsers: eligibleWeekly,
      activeGrants: grantsWeekly,
      statusNote: 'Automatisch; weekly reward verloopt einde week',
      lastEvaluatedAt: slugLast.get(HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3)?.toISOString() ?? null,
    },
    {
      slug: HCP_REWARD_SLUGS.STREAK_GLOW_30,
      title: 'Streak-badge / glow',
      trigger: '≥ 30 dagen streak (current of longest)',
      eligibleUsers: eligibleStreak,
      activeGrants: grantsStreak,
      statusNote: 'Automatisch server-side na HCP-toekenning en bij GET /api/gamification/me',
      lastEvaluatedAt: slugLast.get(HCP_REWARD_SLUGS.STREAK_GLOW_30)?.toISOString() ?? null,
    },
  ];

  const weekRows = serializeLb(weekWorld.rows);
  const featuredWeek = weekRows[0] ?? null;

  return {
    generatedAt: now.toISOString(),
    slides,
    promoSlides,
    lifecycleCounts,
    placementActivePromo,
    targetingActivePromo,
    totalActiveGrants: grantsTotal,
    usersWithActiveGrant: distinctUsers.length,
    rewardRows,
    lastRewardDbTouch: lastTouchAgg._max.updatedAt?.toISOString() ?? null,
    leaderboards: {
      week: weekRows,
      month: serializeLb(monthWorld.rows),
      year: serializeLb(yearWorld.rows),
    },
    featuredWeek,
  };
}
