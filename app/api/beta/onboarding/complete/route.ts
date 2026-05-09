import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { claimBetaTesterRewards } from '@/lib/beta-tester-rewards';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { androidBetaOnboardingCompletedAt: new Date() },
    });

    const { claimed } = await claimBetaTesterRewards(user.id);

    return NextResponse.json({ ok: true, betaTesterRewardsClaimed: claimed });
  } catch (e) {
    console.error('beta onboarding complete:', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
