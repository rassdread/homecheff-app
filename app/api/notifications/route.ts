import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import {
  extractNotificationMetadata,
  notificationVisibleToSellerAndBuyer,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get notifications for the user
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        payload: true,
        readAt: true,
        createdAt: true,
        orderId: true,
      }
    });

    // Check if user is a seller (for filtering order notifications)
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    const isSeller = !!sellerProfile;

    // Transform notifications to match the expected format
    const transformedNotifications = notifications
      .map(notification => {
        const payload = notification.payload as Record<string, unknown>;
        const dataType = String(
          (payload?.data as Record<string, unknown> | undefined)?.type || ''
        );
        const prismaType = String(notification.type);
        const resolvedLink =
          resolveNotificationTargetUrl(prismaType, payload) ||
          (typeof payload?.link === 'string' ? payload.link : undefined) ||
          (typeof payload?.actionUrl === 'string' ? payload.actionUrl : undefined);
        const meta = extractNotificationMetadata(
          prismaType,
          payload,
          notification.orderId
        );

        return {
          id: notification.id,
          type: notification.type.toLowerCase(),
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
          from: (payload as any).from
            ? {
                id: (payload as any).fromId || 'admin',
                name: (payload as any).from,
                username: (payload as any).fromUsername,
                image: (payload as any).fromImage,
              }
            : undefined,
          metadata: {
            productId: (payload as any).productId,
            orderId: (payload as any).orderId || notification.orderId,
            conversationId:
              (payload as any).conversationId ||
              (payload as any).data?.conversationId,
            senderId:
              (payload as any).senderId || (payload as any).data?.senderId,
          },
          payload,
        };
      })
      .filter(notif =>
        notificationVisibleToSellerAndBuyer(
          notif.prismaType,
          notif.payload as Record<string, unknown>,
          isSeller
        )
      );

    const unreadRows = await prisma.notification.findMany({
      where: { userId: user.id, readAt: null },
      select: { type: true, payload: true },
    });
    const unreadCount = unreadRows.filter(row =>
      notificationVisibleToSellerAndBuyer(
        String(row.type),
        row.payload as Record<string, unknown>,
        isSeller
      )
    ).length;

    return NextResponse.json(
      { notifications: transformedNotifications, unreadCount },
      { headers: cors }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: cors }
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    const { notificationIds, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { 
          userId: user.id,
          readAt: null
        },
        data: { readAt: new Date() }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: { 
          id: { in: notificationIds },
          userId: user.id
        },
        data: { readAt: new Date() }
      });
    }

    return NextResponse.json({ success: true }, { headers: cors });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: cors }
    );
  }
}

function getNotificationTitle(type: string, payload: any): string {
  if (payload?.title && typeof payload.title === 'string') {
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