import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCookieFromHeader, hasAndroidBetaDownloadCookie } from '@/lib/affiliate-attribution';

export const dynamic = 'force-dynamic';

function hasBetaIntentCookie(cookieHeader: string | null): boolean {
  return getCookieFromHeader(cookieHeader, 'hc_beta_intent') === '1';
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ authenticated: false, needsOnboarding: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        androidBetaOnboardingCompletedAt: true,
        betaTesterJoinedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, needsOnboarding: false });
    }

    const cookieHeader = req.headers.get('cookie');
    const inBetaFlow =
      hasAndroidBetaDownloadCookie(cookieHeader) ||
      hasBetaIntentCookie(cookieHeader) ||
      Boolean(user.betaTesterJoinedAt);

    const needsOnboarding = !user.androidBetaOnboardingCompletedAt && inBetaFlow;

    return NextResponse.json({
      authenticated: true,
      needsOnboarding,
      onboardingCompleted: Boolean(user.androidBetaOnboardingCompletedAt),
    });
  } catch (e) {
    console.error('beta-status:', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
