import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revokeParentalConsent } from '@/lib/age/parental-consent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const revokeToken = typeof body.token === 'string' ? body.token.trim() : '';
  const session = await auth();

  if (!revokeToken && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string | null = null;
  if (!revokeToken && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const result = await revokeParentalConsent({
    prisma,
    userId,
    revokeToken: revokeToken || null,
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'Er is geen actieve toestemming om in te trekken.',
        messageEn: 'There is no active permission to withdraw.',
      },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    message: 'Toestemming is ingetrokken. Nieuwe verkopen en het instellen van betalingen zijn gepauzeerd.',
    messageEn: 'Permission was withdrawn. New sales and payment setup are paused.',
  });
}
