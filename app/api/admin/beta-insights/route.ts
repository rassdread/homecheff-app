import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AttributionSource, AttributionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [downloadClicks30d, betaSignups30d, betaSignupsAll] = await Promise.all([
      prisma.betaDownloadEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.attribution.count({
        where: {
          source: AttributionSource.ANDROID_BETA_DOWNLOAD,
          createdAt: { gte: since },
          type: AttributionType.USER_SIGNUP,
        },
      }),
      prisma.attribution.count({
        where: {
          source: AttributionSource.ANDROID_BETA_DOWNLOAD,
          type: AttributionType.USER_SIGNUP,
        },
      }),
    ]);

    const onboardingCompleted = await prisma.user.count({
      where: { androidBetaOnboardingCompletedAt: { not: null } },
    });

    const testersWithBadge = await prisma.user.count({
      where: { betaTesterJoinedAt: { not: null } },
    });

    return NextResponse.json({
      downloadClicksLast30Days: downloadClicks30d,
      androidBetaDownloadSignupsLast30Days: betaSignups30d,
      androidBetaDownloadSignupsAllTime: betaSignupsAll,
      usersCompletedBetaOnboarding: onboardingCompleted,
      usersBetaTesterJoined: testersWithBadge,
      attributionSourceKey: AttributionSource.ANDROID_BETA_DOWNLOAD,
    });
  } catch (e) {
    console.error('admin beta-insights:', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
