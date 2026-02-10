import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        createdAt: true
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
        const payload = notification.payload as any;
        const dataType = payload?.data?.type || '';
        const link = getNotificationLink(notification.type, payload) || payload?.link || payload?.actionUrl;
        
        return {
          id: notification.id,
          type: notification.type.toLowerCase(),
          dataType: dataType, // Store original data.type for filtering
          title: getNotificationTitle(notification.type, payload),
          message: payload.body || payload.message || 'Nieuwe notificatie',
          link: link,
          isRead: !!notification.readAt,
          createdAt: notification.createdAt.toISOString(),
          from: payload.from ? {
            id: payload.fromId || 'admin',
            name: payload.from,
            username: payload.fromUsername,
            image: payload.fromImage
          } : undefined,
          metadata: {
            productId: payload.productId,
            orderId: payload.orderId,
            conversationId: payload.conversationId || payload.data?.conversationId,
            senderId: payload.senderId || payload.data?.senderId
          },
          payload: payload // Include full payload for access to all data
        };
      })
      .filter(notif => {
        // Filter order notifications based on user role
        // Only filter ORDER_RECEIVED and ORDER_UPDATE type notifications
        if (notif.type === 'order_received' || notif.type === 'order_update') {
          const isBuyerNotification = 
            notif.dataType === 'ORDER_PLACED' || 
            notif.dataType === 'ORDER_PAID' ||
            notif.dataType === 'ORDER_READY_FOR_PICKUP' ||
            notif.dataType === 'ORDER_DELIVERED' ||
            notif.dataType === 'ORDER_CANCELLED' ||
            (notif.dataType === 'ORDER_STATUS_UPDATE' && notif.link && notif.link.startsWith('/orders/') && !notif.link.startsWith('/verkoper/')) ||
            (notif.link && notif.link.startsWith('/orders/') && !notif.link.startsWith('/verkoper/'));
          
          const isSellerNotification = 
            notif.dataType === 'NEW_ORDER' ||
            notif.dataType === 'PAYMENT_RECEIVED' ||
            (notif.dataType === 'ORDER_STATUS_UPDATE' && notif.link && notif.link.startsWith('/verkoper/orders')) ||
            (notif.link && notif.link.startsWith('/verkoper/orders'));
          
          // If user is both buyer and seller, show both types
          if (isSeller) {
            return isBuyerNotification || isSellerNotification;
          }
          
          // If user is only a buyer, show only buyer notifications
          return isBuyerNotification;
        }
        
        // Show all other notification types
        return true;
      });

    // Calculate unread count
    const unreadCount = transformedNotifications.filter(n => !n.isRead).length;

    return NextResponse.json({ 
      notifications: transformedNotifications,
      unreadCount 
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type: string, payload: any): string {
  switch (type) {
    case 'ADMIN_NOTICE':
      return 'Admin Bericht';
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

function getNotificationLink(type: string, payload: any): string | undefined {
  switch (type) {
    case 'MESSAGE_RECEIVED':
    case 'NEW_CONVERSATION':
      // Check both payload.conversationId and payload.data.conversationId
      const conversationId = payload.conversationId || payload.data?.conversationId;
      return conversationId ? `/messages?conversation=${conversationId}` : '/messages';
    case 'FAVORITE_RECEIVED':
      return payload.productId ? `/product/${payload.productId}` : undefined;
    case 'REVIEW_RECEIVED':
      return payload.productId ? `/product/${payload.productId}` : undefined;
    case 'ORDER_RECEIVED':
    case 'ORDER_UPDATE':
      return payload.orderId ? `/orders` : undefined;
    case 'FAN_REQUEST':
    case 'FOLLOW_RECEIVED':
      return payload.fromId ? `/user/${payload.fromUsername || payload.fromId}` : undefined;
    default:
      return undefined;
  }
}