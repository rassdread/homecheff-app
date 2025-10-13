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

    // Get all pending notifications that should be sent now or soon
    const notifications = await prisma.shiftNotification.findMany({
      where: {
        status: 'PENDING',
        notifyAt: {
          lte: fiveMinutesFromNow // Send up to 5 minutes in advance
        }
      },
      include: {
        deliveryProfile: {
          include: {
            user: true,
            notificationSettings: true
          }
        }
      },
      orderBy: {
        notifyAt: 'asc'
      },
      take: 50 // Process in batches of 50
    });

    console.log(`📬 Found ${notifications.length} notifications to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const notification of notifications) {
      try {
        // Check if notification is past its scheduled time
        if (notification.notifyAt > now) {
          console.log(`⏰ Notification ${notification.id} scheduled for ${notification.notifyAt.toISOString()}, skipping for now`);
          continue;
        }

        // Send the notification
        await NotificationService.sendShiftReminder(
          notification.deliveryProfileId,
          notification.minutesBefore,
          {
            scheduledFor: notification.scheduledFor,
            timeSlot: notification.timeSlot,
            dayOfWeek: notification.dayOfWeek
          }
        );

        // Mark as sent
        await prisma.shiftNotification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });

        // If this is the 0-minute notification and autoGoOnline is enabled, go online
        if (notification.minutesBefore === 0 && 
            notification.deliveryProfile.notificationSettings?.autoGoOnline) {
          await prisma.deliveryProfile.update({
            where: { id: notification.deliveryProfileId },
            data: {
              isOnline: true,
              lastOnlineAt: new Date()
            }
          });
          console.log(`🟢 Auto-enabled online status for profile ${notification.deliveryProfileId}`);
        }

        sentCount++;
        console.log(`✅ Sent notification ${notification.id}`);
      } catch (error) {
        console.error(`❌ Failed to send notification ${notification.id}:`, error);
        
        // Mark as failed
        await prisma.shiftNotification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });

        failedCount++;
      }
    }

    // Clean up old notifications (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedResult = await prisma.shiftNotification.deleteMany({
      where: {
        createdAt: {
          lt: sevenDaysAgo
        },
        status: { in: ['SENT', 'FAILED', 'CANCELLED'] }
      }
    });

    console.log(`🗑️ Cleaned up ${deletedResult.count} old notifications`);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      cleaned: deletedResult.count
    });
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

