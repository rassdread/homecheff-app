import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/notification-service';

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

    // Get or create preferences
    const preferences = await NotificationService.getUserPreferences(user.id);

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    
    // Get existing preferences
    let preferences = await prisma.$queryRaw<any[]>`
      SELECT * FROM "NotificationPreferences" 
      WHERE "userId" = ${user.id}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    // Create if not exists
    if (!preferences) {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "NotificationPreferences" (
          "id", "userId", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${user.id}, ${new Date()}, ${new Date()}
        )
      `;
    }

    // Update preferences
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // Email settings
    if ('emailNewMessages' in body) {
      updateFields.push('"emailNewMessages" = $' + (updateValues.length + 1));
      updateValues.push(body.emailNewMessages);
    }
    if ('emailNewOrders' in body) {
      updateFields.push('"emailNewOrders" = $' + (updateValues.length + 1));
      updateValues.push(body.emailNewOrders);
    }
    if ('emailOrderUpdates' in body) {
      updateFields.push('"emailOrderUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.emailOrderUpdates);
    }
    if ('emailDeliveryUpdates' in body) {
      updateFields.push('"emailDeliveryUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.emailDeliveryUpdates);
    }
    if ('emailMarketing' in body) {
      updateFields.push('"emailMarketing" = $' + (updateValues.length + 1));
      updateValues.push(body.emailMarketing);
    }
    if ('emailWeeklyDigest' in body) {
      updateFields.push('"emailWeeklyDigest" = $' + (updateValues.length + 1));
      updateValues.push(body.emailWeeklyDigest);
    }
    if ('emailSecurityAlerts' in body) {
      updateFields.push('"emailSecurityAlerts" = $' + (updateValues.length + 1));
      updateValues.push(body.emailSecurityAlerts);
    }

    // Push settings
    if ('pushNewMessages' in body) {
      updateFields.push('"pushNewMessages" = $' + (updateValues.length + 1));
      updateValues.push(body.pushNewMessages);
    }
    if ('pushNewOrders' in body) {
      updateFields.push('"pushNewOrders" = $' + (updateValues.length + 1));
      updateValues.push(body.pushNewOrders);
    }
    if ('pushOrderUpdates' in body) {
      updateFields.push('"pushOrderUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.pushOrderUpdates);
    }
    if ('pushDeliveryUpdates' in body) {
      updateFields.push('"pushDeliveryUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.pushDeliveryUpdates);
    }
    if ('pushNearbyProducts' in body) {
      updateFields.push('"pushNearbyProducts" = $' + (updateValues.length + 1));
      updateValues.push(body.pushNearbyProducts);
    }
    if ('pushSecurityAlerts' in body) {
      updateFields.push('"pushSecurityAlerts" = $' + (updateValues.length + 1));
      updateValues.push(body.pushSecurityAlerts);
    }

    // SMS settings
    if ('smsOrderUpdates' in body) {
      updateFields.push('"smsOrderUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.smsOrderUpdates);
    }
    if ('smsDeliveryUpdates' in body) {
      updateFields.push('"smsDeliveryUpdates" = $' + (updateValues.length + 1));
      updateValues.push(body.smsDeliveryUpdates);
    }
    if ('smsSecurityAlerts' in body) {
      updateFields.push('"smsSecurityAlerts" = $' + (updateValues.length + 1));
      updateValues.push(body.smsSecurityAlerts);
    }

    // Chat settings
    if ('chatSoundEnabled' in body) {
      updateFields.push('"chatSoundEnabled" = $' + (updateValues.length + 1));
      updateValues.push(body.chatSoundEnabled);
    }
    if ('chatNotificationPreview' in body) {
      updateFields.push('"chatNotificationPreview" = $' + (updateValues.length + 1));
      updateValues.push(body.chatNotificationPreview);
    }
    if ('chatGroupMentionsOnly' in body) {
      updateFields.push('"chatGroupMentionsOnly" = $' + (updateValues.length + 1));
      updateValues.push(body.chatGroupMentionsOnly);
    }

    // Quiet hours
    if ('quietHoursEnabled' in body) {
      updateFields.push('"quietHoursEnabled" = $' + (updateValues.length + 1));
      updateValues.push(body.quietHoursEnabled);
    }
    if ('quietHoursStart' in body) {
      updateFields.push('"quietHoursStart" = $' + (updateValues.length + 1));
      updateValues.push(body.quietHoursStart);
    }
    if ('quietHoursEnd' in body) {
      updateFields.push('"quietHoursEnd" = $' + (updateValues.length + 1));
      updateValues.push(body.quietHoursEnd);
    }

    // Always update timestamp
    updateFields.push('"updatedAt" = $' + (updateValues.length + 1));
    updateValues.push(new Date());

    if (updateFields.length > 1) { // More than just updatedAt
      await prisma.$executeRawUnsafe(`
        UPDATE "NotificationPreferences"
        SET ${updateFields.join(', ')}
        WHERE "userId" = $${updateValues.length + 1}
      `, ...updateValues, user.id);
    }

    // Fetch updated preferences
    const updatedPreferences = await NotificationService.getUserPreferences(user.id);

    return NextResponse.json({ 
      success: true,
      preferences: updatedPreferences 
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

