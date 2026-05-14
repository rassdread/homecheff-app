import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import {
  mapNotificationRow,
  countVisibleUnreadFromRows,
} from '@/lib/notifications/mapNotificationForApi';
import { countEffectiveUnreadNotifications } from '@/lib/notifications/effectiveUnreadCount';
import { logNotificationDiag } from '@/lib/notifications/fetch-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
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
      logNotificationDiag('notifications_fetch_failed', {
        reason: 'no_user_for_session',
      });
      return NextResponse.json(
        { error: 'Unauthorized', notifications: [], unreadCount: 0 },
        { status: 401, headers },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let notifications: Array<{
      id: string;
      type: unknown;
      payload: unknown;
      readAt: Date | null;
      createdAt: Date;
      orderId: string | null;
    }> = [];

    try {
      notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50,
        skip: Number.isFinite(offset) && offset >= 0 ? offset : 0,
        select: {
          id: true,
          type: true,
          payload: true,
          readAt: true,
          createdAt: true,
          orderId: true,
        },
      });
    } catch (e) {
      const code =
        e instanceof Prisma.PrismaClientKnownRequestError ? e.code : 'query';
      logNotificationDiag('notifications_fetch_failed', {
        reason: `list_${code}`,
      });
      return NextResponse.json(
        { notifications: [], unreadCount: 0 },
        { headers },
      );
    }

    const sellerProfile = await prisma.sellerProfile
      .findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      .catch(() => null);
    const isSeller = !!sellerProfile;

    const transformedNotifications = notifications
      .map((n) => mapNotificationRow(n, isSeller))
      .filter((row) => row != null);

    let unreadRows: Array<{
      id: string;
      type: unknown;
      payload: unknown;
      readAt: Date | null;
      createdAt: Date;
      orderId: string | null;
    }> = [];
    try {
      unreadRows = await prisma.notification.findMany({
        where: { userId: user.id, readAt: null },
        select: {
          id: true,
          type: true,
          payload: true,
          readAt: true,
          createdAt: true,
          orderId: true,
        },
      });
    } catch (e) {
      const code =
        e instanceof Prisma.PrismaClientKnownRequestError ? e.code : 'query';
      logNotificationDiag('notifications_fetch_failed', {
        reason: `unread_${code}`,
      });
      return NextResponse.json(
        { notifications: transformedNotifications, unreadCount: 0 },
        { headers },
      );
    }

    const unreadCount = countVisibleUnreadFromRows(unreadRows, isSeller);

    return NextResponse.json(
      { notifications: transformedNotifications, unreadCount },
      { headers },
    );
  } catch (error) {
    logNotificationDiag('notifications_fetch_failed', {
      reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { headers },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const user = await findUserByCanonicalEmail(prisma, session.user.email, {
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: cors });
    }

    const { notificationIds, markAllAsRead } = body as {
      notificationIds?: unknown;
      markAllAsRead?: unknown;
    };

    if (markAllAsRead === true) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    } else if (Array.isArray(notificationIds)) {
      const ids = notificationIds.filter((id): id is string => typeof id === 'string');
      if (ids.length > 0) {
        await prisma.notification.updateMany({
          where: {
            id: { in: ids },
            userId: user.id,
          },
          data: { readAt: new Date() },
        });
      }
    }

    const sellerProfile = await prisma.sellerProfile
      .findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      .catch(() => null);
    const isSeller = !!sellerProfile;

    const unreadCount = await countEffectiveUnreadNotifications(user.id, isSeller);

    return NextResponse.json({ success: true, unreadCount }, { headers: cors });
  } catch (error) {
    logNotificationDiag('notifications_fetch_failed', {
      reason: error instanceof Error ? error.message.slice(0, 80) : 'patch',
    });
    return NextResponse.json(
      { success: false, unreadCount: 0 },
      { status: 200, headers: cors },
    );
  }
}
