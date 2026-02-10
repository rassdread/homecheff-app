import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Get all order-related notifications
    // Filter by notification type (orderId/deliveryOrderId are in payload JSON, not as separate columns)
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: {
          in: [
            NotificationType.ORDER_RECEIVED,
            NotificationType.ORDER_UPDATE
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Transform notifications - all data is in payload
    const transformed = allNotifications.map(notif => {
      const payload = notif.payload as any;
      return {
        id: notif.id,
        type: notif.type || payload?.type || 'ORDER_UPDATE',
        title: payload?.title || 'Bestelling update',
        message: payload?.body || payload?.message || '',
        orderId: payload?.orderId || null,
        deliveryOrderId: payload?.deliveryOrderId || null,
        orderNumber: payload?.orderNumber || null,
        link: payload?.link || payload?.actionUrl || (payload?.orderId ? `/orders/${payload.orderId}` : '/orders'),
        isRead: !!notif.readAt,
        createdAt: notif.createdAt.toISOString(),
        countdownData: payload?.countdownData || null
      };
    });

    return NextResponse.json({ 
      notifications: transformed,
      unreadCount: transformed.filter(n => !n.isRead).length
    });
  } catch (error) {
    console.error('Error fetching order notifications:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van notificaties' },
      { status: 500 }
    );
  }
}

