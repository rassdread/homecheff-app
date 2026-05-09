import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordDailyLoginIfNeeded } from '@/lib/gamification/daily-login-hcp';
import { hcpProgressToNextLevel } from '@/lib/gamification/hcp-level';
import { consumePendingClientRewards } from '@/lib/gamification/hcp-pending-client';
import { getWeeklyChallengesForUser } from '@/lib/gamification/weekly-challenges';
import type { GamificationMeResponse } from '@/lib/gamification/gamification-me-types';
import { mondayStartUtc, periodRankFromGroups } from '@/lib/gamification/leaderboard-queries';
import { buildGamificationRewardsDto } from '@/lib/gamification/me-rewards-dto';

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    try {
      await recordDailyLoginIfNeeded(userId);
    } catch (e) {
      console.warn('[gamification/me] daily login', e);
    }

    try {
      const { runBadgeEvaluationForUser } = await import('@/lib/gamification/unlock-badges');
      const { evaluateHcpRewardsForUser } = await import('@/lib/gamification/hcp-rewards-engine');
      await runBadgeEvaluationForUser(userId);
      await evaluateHcpRewardsForUser(userId);
    } catch (e) {
      console.warn('[gamification/me] badge/reward sync', e);
    }

    const [user, pendingRewards, stats, weekly] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { hcpWelcomeSeenAt: true },
      }),
      consumePendingClientRewards(userId),
      prisma.userHcpStats.findUnique({
        where: { userId },
      }),
      getWeeklyChallengesForUser(userId),
    ]);

    const totalHcp = stats?.totalHcp ?? 0;
    const { level, nextLevelHcp, hcpToNextLevel } = hcpProgressToNextLevel(totalHcp);

    const weekStart = mondayStartUtc();
    const [weeklyGroups, dbRewards] = await Promise.all([
      prisma.hcpEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekStart } },
        _sum: { points: true },
      }),
      prisma.userHcpReward.findMany({ where: { userId } }),
    ]);
    const weeklyRank = periodRankFromGroups(weeklyGroups, userId);

    const hcpRewards = buildGamificationRewardsDto({
      totalHcp,
      weeklyRank,
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      dbRewards,
    });

    const recentEvents = await prisma.hcpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        points: true,
        sourceType: true,
        sourceId: true,
        createdAt: true,
      },
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: {
          select: {
            slug: true,
            name: true,
            description: true,
            iconKey: true,
          },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });

    const badges = userBadges.map((ub) => ({
      slug: ub.badge.slug,
      name: ub.badge.name,
      description: ub.badge.description,
      iconKey: ub.badge.iconKey,
      awardedAt: ub.awardedAt.toISOString(),
    }));

    const body: GamificationMeResponse = {
      totalHcp,
      level,
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      recentEvents: recentEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      badges,
      nextLevelHcp,
      hcpToNextLevel,
      pendingClientRewards: pendingRewards,
      hcpWelcomePending: user?.hcpWelcomeSeenAt == null,
      weeklyChallenges: { weekKey: weekly.weekKey, items: weekly.items },
      hcpRewards,
    };

    return NextResponse.json(body);
  } catch (e) {
    console.error('[gamification/me]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
