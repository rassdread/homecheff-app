import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { deliveryProfileId, message, type, subject } = await request.json();

    if (!deliveryProfileId || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { id: deliveryProfileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        id: `admin-${Date.now()}-${deliveryProfile.userId}`,
        userId: deliveryProfile.userId,
        type: 'ADMIN_NOTICE',
        payload: {
          title: subject || 'Bericht van HomeCheff Admin',
          message: message,
          from: 'admin',
          deliveryProfileId: deliveryProfileId,
          messageType: type
        }
      }
    });

    // TODO: Implement actual push notification and email sending
    // For now, we'll just log the action
    console.log(`Message sent to delivery profile ${deliveryProfileId}:`, {
      type,
      subject,
      message,
      recipient: deliveryProfile.user.email
    });

    return NextResponse.json({ 
      success: true, 
      notificationId: notification.id,
      message: 'Bericht succesvol verzonden'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
