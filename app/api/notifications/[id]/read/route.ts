import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import { countEffectiveUnreadNotifications } from '@/lib/notifications/effectiveUnreadCount';

export const dynamic = 'force-dynamic';

async function handleMarkRead(
  _req: NextRequest,
  params: Promise<{ id: string }>,
) {
  const cors = getCorsHeaders(_req);
  const headers = {
    ...cors,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const user = await findUserByCanonicalEmail(prisma, session.user.email, {
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 200) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers });
    }

    await prisma.notification.updateMany({
      where: {
        id,
        userId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const sellerProfile = await prisma.sellerProfile
      .findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      .catch(() => null);
    const isSeller = !!sellerProfile;
    const unreadCount = await countEffectiveUnreadNotifications(user.id, isSeller);

    return NextResponse.json({ success: true, unreadCount }, { headers });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false, unreadCount: 0 },
      { status: 500, headers },
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return handleMarkRead(req, ctx.params);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return handleMarkRead(req, ctx.params);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return handleMarkRead(req, ctx.params);
}
