import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import {
  extractNotificationMetadata,
  notificationVisibleToSellerAndBuyer,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';
import { logNotificationDiag } from '@/lib/notifications/fetch-diagnostics';

export const dynamic = 'force-dynamic';

function asPayloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function prismaTypeString(t: unknown): string {
  return typeof t === 'string' ? t : String(t ?? 'UNKNOWN');
}

function mapNotificationRow(
  notification: {
    id: string;
    type: unknown;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
    orderId: string | null;
  },
  isSeller: boolean,
) {
  try {
    const payload = asPayloadRecord(notification.payload);
    const data = asPayloadRecord(payload.data);
    const dataType = String(data.type || '');
    const prismaType = prismaTypeString(notification.type);
    const resolvedLink =
      resolveNotificationTargetUrl(prismaType, payload) ||
      (typeof payload.link === 'string' ? payload.link : undefined) ||
      (typeof payload.actionUrl === 'string' ? payload.actionUrl : undefined);
    const meta = extractNotificationMetadata(
      prismaType,
      payload,
      notification.orderId,
    );

    const typeLower = prismaType.toLowerCase();
    const fromVal = payload.from;
    const fromName = typeof fromVal === 'string' ? fromVal : undefined;

    const mapped = {
      id: notification.id,
      type: typeLower,
      prismaType,
      dataType,
      title: getNotificationTitle(prismaType, payload),
      message:
        (typeof payload.body === 'string' && payload.body) ||
        (typeof payload.message === 'string' && payload.message) ||
        'Nieuwe notificatie',
      link: resolvedLink,
      ...meta,
      isRead: !!notification.readAt,
      createdAt: notification.createdAt.toISOString(),
      from: fromName
        ? {
            id:
              typeof payload.fromId === 'string' && payload.fromId
                ? payload.fromId
                : 'admin',
            name: fromName,
            username:
              typeof payload.fromUsername === 'string'
                ? payload.fromUsername
                : undefined,
            image:
              typeof payload.fromImage === 'string'
                ? payload.fromImage
                : undefined,
          }
        : undefined,
      metadata: {
        productId:
          typeof payload.productId === 'string' ? payload.productId : undefined,
        orderId:
          (typeof payload.orderId === 'string' && payload.orderId) ||
          notification.orderId ||
          undefined,
        conversationId:
          (typeof payload.conversationId === 'string' &&
            payload.conversationId) ||
          (typeof data.conversationId === 'string' && data.conversationId) ||
          undefined,
        senderId:
          (typeof payload.senderId === 'string' && payload.senderId) ||
          (typeof data.senderId === 'string' && data.senderId) ||
          undefined,
      },
      payload,
    };

    if (
      !notificationVisibleToSellerAndBuyer(
        mapped.prismaType,
        mapped.payload,
        isSeller,
      )
    ) {
      return null;
    }
    return mapped;
  } catch (e) {
    logNotificationDiag('notifications_payload_fallback', {
      reason: e instanceof Error ? e.message.slice(0, 80) : 'map_error',
    });
    return null;
  }
}

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

    let unreadRows: Array<{ type: unknown; payload: unknown }> = [];
    try {
      unreadRows = await prisma.notification.findMany({
        where: { userId: user.id, readAt: null },
        select: { type: true, payload: true },
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

    const unreadCount = unreadRows.filter((row) => {
      try {
        return notificationVisibleToSellerAndBuyer(
          prismaTypeString(row.type),
          asPayloadRecord(row.payload),
          isSeller,
        );
      } catch {
        return false;
      }
    }).length;

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

    return NextResponse.json({ success: true }, { headers: cors });
  } catch (error) {
    logNotificationDiag('notifications_fetch_failed', {
      reason: error instanceof Error ? error.message.slice(0, 80) : 'patch',
    });
    return NextResponse.json({ success: false }, { status: 200, headers: cors });
  }
}

function getNotificationTitle(type: string, payload: Record<string, unknown>): string {
  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }
  switch (type) {
    case 'ADMIN_NOTICE':
      return 'HomeCheff melding';
    case 'FAN_REQUEST':
      return 'Nieuwe Fan';
    case 'PROP_RECEIVED':
      return 'Prop Ontvangen';
    case 'FOLLOW_RECEIVED':
      return 'Nieuwe Follower';
    case 'FAVORITE_RECEIVED':
      return 'Product Favoriet';
    case 'REVIEW_RECEIVED':
      return 'Nieuwe Review';
    case 'ORDER_RECEIVED':
      return 'Nieuwe Bestelling';
    case 'ORDER_UPDATE':
      return 'Bestelling Update';
    case 'MESSAGE_RECEIVED':
      return 'Nieuw Bericht';
    case 'NEW_CONVERSATION':
      return 'Nieuw Gesprek';
    default:
      return 'Notificatie';
  }
}
