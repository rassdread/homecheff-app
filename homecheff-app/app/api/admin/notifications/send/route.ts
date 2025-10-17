import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { message, targetType } = await req.json();

    if (!message || !targetType) {
      return NextResponse.json({ error: 'Message and targetType are required' }, { status: 400 });
    }

    // Get target users based on targetType
    let targetUsers: { id: string }[] = [];

    if (targetType === 'all') {
      targetUsers = await prisma.user.findMany({
        select: { id: true },
        where: {
          role: { not: 'ADMIN' } // Don't send to other admins
        }
      });
    } else if (targetType === 'sellers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true },
        where: {
          role: 'SELLER'
        }
      });
    } else if (targetType === 'buyers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true },
        where: {
          role: 'BUYER'
        }
      });
    } else if (targetType === 'delivery') {
      targetUsers = await prisma.user.findMany({
        select: { id: true },
        where: {
          DeliveryProfile: { isNot: null }
        }
      });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUsers.map(user => 
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type: 'ADMIN_NOTICE',
            payload: {
              message,
              from: 'Admin',
              timestamp: new Date().toISOString()
            }
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      notificationsCreated: notifications.length,
      message: `Notificatie verzonden naar ${notifications.length} gebruikers`
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
