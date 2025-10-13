import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/notification-service';

export const dynamic = 'force-dynamic';

// This cron runs every minute to send pending notifications
export async function GET(req: NextRequest) {
  try {
    console.log('📨 Starting notification sender...');

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Get all pending notifications that should be sent now or soon (using raw SQL)
    const notifications = await prisma.$queryRaw<any[]>`
      SELECT 
        sn.*,
        dp."userId",
        u."name", u."email", u."phoneNumber"
      FROM "ShiftNotification" sn
      JOIN "DeliveryProfile" dp ON sn."deliveryProfileId" = dp."id"
      JOIN "User" u ON dp."userId" = u."id"
      WHERE sn."status" = 'PENDING'
        AND sn."notifyAt" <= ${fiveMinutesFromNow}
      ORDER BY sn."notifyAt" ASC
      LIMIT 50
    `;

    console.log(`📬 Found ${notifications.length} notifications to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const notification of notifications) {
      try {
        // Check if notification is past its scheduled time
        const notifyAtDate = new Date(notification.notifyAt);
        if (notifyAtDate > now) {
          console.log(`⏰ Notification ${notification.id} scheduled for ${notifyAtDate.toISOString()}, skipping for now`);
          continue;
        }

        // Send the notification
        await NotificationService.sendShiftReminder(
          notification.deliveryProfileId,
          notification.minutesBefore,
          {
            scheduledFor: new Date(notification.scheduledFor),
            timeSlot: notification.timeSlot,
            dayOfWeek: notification.dayOfWeek
          }
        );

        // Mark as sent (using raw SQL)
        await prisma.$executeRaw`
          UPDATE "ShiftNotification" 
          SET "status" = 'SENT', "sentAt" = ${new Date()}, "updatedAt" = ${new Date()}
          WHERE "id" = ${notification.id}
        `;

        // If this is the 0-minute notification and autoGoOnline is enabled, go online
        if (notification.minutesBefore === 0) {
          const settings = await prisma.$queryRaw<any[]>`
            SELECT * FROM "DeliveryNotificationSettings" 
            WHERE "deliveryProfileId" = ${notification.deliveryProfileId}
            LIMIT 1
          `.then(rows => rows[0]).catch(() => null);
          
          if (settings?.autoGoOnline) {
            await prisma.deliveryProfile.update({
              where: { id: notification.deliveryProfileId },
              data: {
                isOnline: true,
                lastOnlineAt: new Date()
              }
            });
            console.log(`🟢 Auto-enabled online status for profile ${notification.deliveryProfileId}`);
          }
        }

        sentCount++;
        console.log(`✅ Sent notification ${notification.id}`);
      } catch (error) {
        console.error(`❌ Failed to send notification ${notification.id}:`, error);
        
        // Mark as failed (using raw SQL)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await prisma.$executeRaw`
          UPDATE "ShiftNotification" 
          SET "status" = 'FAILED', "error" = ${errorMsg}, "updatedAt" = ${new Date()}
          WHERE "id" = ${notification.id}
        `;

        failedCount++;
      }
    }

    // Clean up old notifications (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedResult = await prisma.$executeRaw`
      DELETE FROM "ShiftNotification"
      WHERE "createdAt" < ${sevenDaysAgo}
        AND "status" IN ('SENT', 'FAILED', 'CANCELLED')
    `;

    console.log(`🗑️ Cleaned up ${deletedResult} old notifications`);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      cleaned: deletedResult
    });
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

