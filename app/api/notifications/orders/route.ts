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

    // Check if user is a seller
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    const isSeller = !!sellerProfile;

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

    // Transform and filter notifications based on user role
    // Buyer notifications: ORDER_PLACED, ORDER_PAID, ORDER_STATUS_UPDATE, ORDER_DELIVERED, etc. (link to /orders/)
    // Seller notifications: NEW_ORDER, PAYMENT_RECEIVED (link to /verkoper/orders)
    const transformed = allNotifications
      .map(notif => {
        const payload = notif.payload as any;
        const dataType = payload?.data?.type || payload?.type || '';
        const link = payload?.link || payload?.actionUrl || (payload?.orderId ? `/orders/${payload.orderId}` : '/orders');
        
        return {
          id: notif.id,
          type: notif.type || payload?.type || 'ORDER_UPDATE',
          dataType: dataType, // Store original data.type for filtering
          title: payload?.title || 'Bestelling update',
          message: payload?.body || payload?.message || '',
          orderId: payload?.orderId || null,
          deliveryOrderId: payload?.deliveryOrderId || null,
          orderNumber: payload?.orderNumber || null,
          link: link,
          isRead: !!notif.readAt,
          createdAt: notif.createdAt.toISOString(),
          countdownData: payload?.countdownData || null
        };
      })
      .filter(notif => {
        // Filter based on user role and notification type/link
        // Buyer notifications have link to /orders/ (not /verkoper/orders)
        // Seller notifications have link to /verkoper/orders
        
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
      });

    // Calculate separate counts for buyer and seller notifications
    const buyerNotifications = transformed.filter(notif => {
      const isBuyerNotification = 
        notif.dataType === 'ORDER_PLACED' || 
        notif.dataType === 'ORDER_PAID' ||
        notif.dataType === 'ORDER_READY_FOR_PICKUP' ||
        notif.dataType === 'ORDER_DELIVERED' ||
        notif.dataType === 'ORDER_CANCELLED' ||
        (notif.dataType === 'ORDER_STATUS_UPDATE' && notif.link && notif.link.startsWith('/orders/') && !notif.link.startsWith('/verkoper/')) ||
        (notif.link && notif.link.startsWith('/orders/') && !notif.link.startsWith('/verkoper/'));
      return isBuyerNotification;
    });
    
    const sellerNotifications = transformed.filter(notif => {
      const isSellerNotification = 
        notif.dataType === 'NEW_ORDER' ||
        notif.dataType === 'PAYMENT_RECEIVED' ||
        (notif.dataType === 'ORDER_STATUS_UPDATE' && notif.link && notif.link.startsWith('/verkoper/orders')) ||
        (notif.link && notif.link.startsWith('/verkoper/orders'));
      return isSellerNotification;
    });

    return NextResponse.json({ 
      notifications: transformed,
      unreadCount: transformed.filter(n => !n.isRead).length,
      buyerUnreadCount: buyerNotifications.filter(n => !n.isRead).length,
      sellerUnreadCount: sellerNotifications.filter(n => !n.isRead).length
    });
  } catch (error) {
    console.error('Error fetching order notifications:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van notificaties' },
      { status: 500 }
    );
  }
}

