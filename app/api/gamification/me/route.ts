import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordDailyLoginIfNeeded } from '@/lib/gamification/daily-login-hcp';
import { hcpProgressToNextLevel } from '@/lib/gamification/hcp-level';

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

    const stats = await prisma.userHcpStats.findUnique({
      where: { userId },
    });

    const totalHcp = stats?.totalHcp ?? 0;
    const { level, nextLevelHcp, hcpToNextLevel } = hcpProgressToNextLevel(totalHcp);

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

    return NextResponse.json({
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
    });
  } catch (e) {
    console.error('[gamification/me]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
