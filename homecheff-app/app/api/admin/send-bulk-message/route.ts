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

    const { userIds, message, type, subject } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get users to send messages to
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            id: `bulk-${Date.now()}-${user.id}`,
            userId: user.id,
            type: 'ADMIN_NOTICE',
            payload: {
              title: subject || 'Bericht van HomeCheff Admin',
              message: message,
              from: 'admin',
              bulkMessage: true,
              messageType: type
            }
          }
        })
      )
    );

    // TODO: Implement actual push notification and email sending
    // For now, we'll just log the action
    console.log(`Bulk message sent to ${users.length} users:`, {
      type,
      subject,
      message,
      recipients: users.map(u => u.email)
    });

    return NextResponse.json({ 
      success: true, 
      notificationsSent: notifications.length,
      message: `Bericht succesvol verzonden naar ${notifications.length} gebruikers`
    });

  } catch (error) {
    console.error('Error sending bulk message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
