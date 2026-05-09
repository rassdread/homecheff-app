import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { getCorsHeaders } from '@/lib/apiCors';
import {
  resolveNotificationTargetUrl,
  isSellerDashboardOrderBadgeNotification,
  notificationVisibleToSellerAndBuyer,
} from '@/lib/notifications/notificationRouting';

function isBuyerFacingOrderNotification(
  prismaType: string,
  payload: Record<string, unknown>
): boolean {
  const typeUpper = prismaType.toUpperCase();
  if (typeUpper !== 'ORDER_RECEIVED' && typeUpper !== 'ORDER_UPDATE') {
    return false;
  }
  if (isSellerDashboardOrderBadgeNotification(prismaType, payload)) {
    return false;
  }
  const link =
    resolveNotificationTargetUrl(typeUpper, payload) || '';
  return link.startsWith('/orders') && !link.includes('/verkoper/');
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const headers = {
    ...cors,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401, headers });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404, headers });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const isSeller = !!sellerProfile;

    const unreadOrderRows = await prisma.notification.findMany({
      where: {
        userId: user.id,
        readAt: null,
        type: {
          in: [NotificationType.ORDER_RECEIVED, NotificationType.ORDER_UPDATE],
        },
      },
      select: { id: true, type: true, payload: true },
    });

    const sellerUnreadCount = unreadOrderRows.filter(row =>
      isSellerDashboardOrderBadgeNotification(
        String(row.type),
        row.payload as Record<string, unknown>
      )
    ).length;

    const buyerUnreadCount = unreadOrderRows.filter(row =>
      isBuyerFacingOrderNotification(
        String(row.type),
        row.payload as Record<string, unknown>
      )
    ).length;

    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: {
          in: [NotificationType.ORDER_RECEIVED, NotificationType.ORDER_UPDATE],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const visibleRecent = recentNotifications.filter(raw =>
      notificationVisibleToSellerAndBuyer(
        String(raw.type),
        raw.payload as Record<string, unknown>,
        isSeller
      )
    );

    const transformed = visibleRecent.map(notif => {
      const payload = notif.payload as Record<string, unknown>;
      const dataType =
        String(
          (payload?.data as Record<string, unknown> | undefined)?.type ||
            payload?.type ||
            ''
        ) || '';
      const prismaType = String(notif.type);
      const resolved =
        resolveNotificationTargetUrl(prismaType.toUpperCase(), payload) ||
        (typeof payload?.link === 'string' ? payload.link : undefined) ||
        (typeof payload?.actionUrl === 'string' ? payload.actionUrl : undefined) ||
        (payload?.orderId ? `/orders/${String(payload.orderId)}` : '/orders');

      return {
        id: notif.id,
        type: notif.type || prismaType || 'ORDER_UPDATE',
        dataType,
        title:
          (typeof payload?.title === 'string' && payload.title) ||
          'Bestelling update',
        message:
          (typeof payload?.body === 'string' && payload.body) ||
          (typeof payload?.message === 'string' && payload.message) ||
          '',
        orderId: (payload?.orderId as string) || null,
        deliveryOrderId: (payload?.deliveryOrderId as string) || null,
        orderNumber: (payload?.orderNumber as string) || null,
        link: resolved,
        isRead: !!notif.readAt,
        createdAt: notif.createdAt.toISOString(),
        countdownData: (payload?.countdownData as Record<string, unknown>) || null,
      };
    });

    const unreadInFeed = transformed.filter(n => !n.isRead).length;

    return NextResponse.json(
      {
        notifications: transformed,
        unreadCount: unreadInFeed,
        buyerUnreadCount,
        sellerUnreadCount,
      },
      { headers }
    );
  } catch (error) {
    console.error('Error fetching order notifications:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van notificaties' },
      { status: 500, headers }
    );
  }
}
