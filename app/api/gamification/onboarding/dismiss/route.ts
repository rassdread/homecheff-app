import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { hcpWelcomeSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[gamification/onboarding/dismiss]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
