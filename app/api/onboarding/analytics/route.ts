import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const body = (await req.json().catch(() => ({}))) as {
      eventType?: string;
      metadata?: Record<string, unknown>;
    };
    const eventType = typeof body.eventType === 'string' ? body.eventType.trim() : '';
    if (!eventType || eventType.length > 120) {
      return NextResponse.json({ ok: false }, { status: 400, headers: cors });
    }

    const session = await getServerSession(authOptions);
    const userId =
      session?.user?.email &&
      (await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      }))?.id;

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        entityType: 'ONBOARDING',
        entityId: eventType.slice(0, 80),
        userId: userId ?? null,
        metadata: {
          ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
          authenticated: Boolean(session?.user),
        },
      },
    });

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    console.error('[onboarding/analytics]', e);
    return NextResponse.json({ ok: false }, { status: 500, headers: cors });
  }
}
