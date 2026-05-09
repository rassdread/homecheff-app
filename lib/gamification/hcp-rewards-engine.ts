import { HcpRewardStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mondayStartUtc, periodRankFromGroups } from '@/lib/gamification/leaderboard-queries';
import { hcpIsoWeekKeyUtc } from '@/lib/gamification/weekly-challenges';

export const HCP_REWARD_SLUGS = {
  PROFILE_BOOST_500: 'profile_boost_500',
  FEATURED_CREATOR_1000: 'featured_creator_1000',
  WEEKLY_SPOTLIGHT_TOP3: 'weekly_spotlight_top3',
  STREAK_GLOW_30: 'streak_glow_30',
} as const;

function weekEndUtc(weekStart: Date): Date {
  const e = new Date(weekStart);
  e.setUTCDate(e.getUTCDate() + 7);
  return e;
}

async function computeWeeklyRank(userId: string): Promise<number | null> {
  const weekStart = mondayStartUtc();
  const weeklyGroups = await prisma.hcpEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: weekStart } },
    _sum: { points: true },
  });
  return periodRankFromGroups(weeklyGroups, userId);
}

/**
 * Idempotente HCP-beloningen (alleen interne flags / geen uitbetaling).
 * Roept na elke relevante HCP-award en vanuit backfill-scripts.
 */
export async function evaluateHcpRewardsForUser(userId: string): Promise<void> {
  const now = new Date();
  const weekStart = mondayStartUtc(now);
  const weekEnd = weekEndUtc(weekStart);

  await prisma.userHcpReward.updateMany({
    where: {
      userId,
      status: HcpRewardStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    data: { status: HcpRewardStatus.EXPIRED },
  });

  const [stats, weeklyRank] = await Promise.all([
    prisma.userHcpStats.findUnique({
      where: { userId },
      select: { totalHcp: true, currentStreak: true, longestStreak: true },
    }),
    computeWeeklyRank(userId),
  ]);

  const total = stats?.totalHcp ?? 0;
  const streak = Math.max(stats?.currentStreak ?? 0, stats?.longestStreak ?? 0);

  if (total >= 500) {
    const slug = HCP_REWARD_SLUGS.PROFILE_BOOST_500;
    const existing = await prisma.userHcpReward.findUnique({
      where: { userId_slug: { userId, slug } },
    });
    if (!existing) {
      await prisma.userHcpReward.create({
        data: {
          userId,
          slug,
          status: HcpRewardStatus.ACTIVE,
          grantedAt: now,
          expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          metadata: { kind: 'visibility_boost' },
        },
      });
    }
  }

  if (total >= 1000) {
    const slug = HCP_REWARD_SLUGS.FEATURED_CREATOR_1000;
    await prisma.userHcpReward.upsert({
      where: { userId_slug: { userId, slug } },
      create: {
        userId,
        slug,
        status: HcpRewardStatus.ACTIVE,
        grantedAt: now,
        metadata: { kind: 'featured_eligibility' },
      },
      update: {
        status: HcpRewardStatus.ACTIVE,
      },
    });
  }

  if (weeklyRank != null && weeklyRank <= 3) {
    const slug = HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3;
    await prisma.userHcpReward.upsert({
      where: { userId_slug: { userId, slug } },
      create: {
        userId,
        slug,
        status: HcpRewardStatus.ACTIVE,
        grantedAt: now,
        expiresAt: weekEnd,
        metadata: { weekKey: hcpIsoWeekKeyUtc(), rank: weeklyRank },
      },
      update: {
        status: HcpRewardStatus.ACTIVE,
        expiresAt: weekEnd,
        metadata: { weekKey: hcpIsoWeekKeyUtc(), rank: weeklyRank },
      },
    });
  }

  if (streak >= 30) {
    const slug = HCP_REWARD_SLUGS.STREAK_GLOW_30;
    await prisma.userHcpReward.upsert({
      where: { userId_slug: { userId, slug } },
      create: {
        userId,
        slug,
        status: HcpRewardStatus.ACTIVE,
        grantedAt: now,
        metadata: { kind: 'profile_glow' },
      },
      update: { status: HcpRewardStatus.ACTIVE },
    });
  }
}
