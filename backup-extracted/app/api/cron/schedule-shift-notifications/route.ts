import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This cron runs every hour to schedule shift notifications for the next 48 hours
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Get all active delivery profiles
    const profiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true
      }
    });
    let scheduledCount = 0;

    for (const profile of profiles) {
      // Get notification settings separately (until Prisma client is regenerated)
      const notificationSettings = await prisma.$queryRaw<any[]>`
        SELECT * FROM "DeliveryNotificationSettings" 
        WHERE "deliveryProfileId" = ${profile.id}
        LIMIT 1
      `.then(rows => rows[0]);
      
      if (!notificationSettings) continue;
      if (!notificationSettings.enablePushNotifications && 
          !notificationSettings.enableEmailNotifications && 
          !notificationSettings.enableSmsNotifications) {
        continue;
      }

      const reminders = JSON.parse(notificationSettings.shiftReminders || '[60, 30, 5]') as number[];
      const { availableDays, availableTimeSlots } = profile;

      // Map day names to day numbers (1=Monday, 7=Sunday)
      const dayMap: Record<string, number> = {
        'maandag': 1,
        'dinsdag': 2,
        'woensdag': 3,
        'donderdag': 4,
        'vrijdag': 5,
        'zaterdag': 6,
        'zondag': 0
      };

      // Time slot mappings
      const timeSlotMap: Record<string, string> = {
        'morning': '09:00',
        'afternoon': '12:00',
        'evening': '17:00'
      };

      // Go through next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const dayOfWeek = checkDate.getDay();
        
        // Find matching day name
        const dayName = Object.entries(dayMap).find(([_, num]) => num === dayOfWeek)?.[0];
        
        if (!dayName || !availableDays.includes(dayName)) continue;

        // Check each time slot
        for (const timeSlot of availableTimeSlots) {
          const startTime = timeSlotMap[timeSlot as keyof typeof timeSlotMap];
          if (!startTime) continue;

          // Create shift datetime
          const [hours, minutes] = startTime.split(':').map(Number);
          const shiftTime = new Date(checkDate);
          shiftTime.setHours(hours, minutes, 0, 0);

          // Skip if shift is in the past or too far in future
          if (shiftTime < now || shiftTime > endTime) continue;

          // Schedule notification for each reminder
          for (const minutesBefore of reminders) {
            const notifyAt = new Date(shiftTime.getTime() - minutesBefore * 60 * 1000);

            // Skip if notification time is in the past
            if (notifyAt < now) continue;

            // Check if notification already exists (using raw SQL)
            const existing = await prisma.$queryRaw<any[]>`
              SELECT * FROM "ShiftNotification" 
              WHERE "deliveryProfileId" = ${profile.id}
                AND "scheduledFor" = ${shiftTime}
                AND "minutesBefore" = ${minutesBefore}
                AND "status" IN ('PENDING', 'SENT')
              LIMIT 1
            `.then(rows => rows[0]).catch(() => null);

            if (existing) continue;

            // Check quiet hours
            let skipDueToQuietHours = false;
            if (notificationSettings.quietHoursEnabled && 
                notificationSettings.quietHoursStart && 
                notificationSettings.quietHoursEnd) {
              const notifyHour = notifyAt.getHours();
              const notifyMinute = notifyAt.getMinutes();
              const notifyTimeStr = `${String(notifyHour).padStart(2, '0')}:${String(notifyMinute).padStart(2, '0')}`;
              
              const quietStart = notificationSettings.quietHoursStart;
              const quietEnd = notificationSettings.quietHoursEnd;

              if (quietStart < quietEnd) {
                // Normal range (e.g., 22:00 to 08:00)
                skipDueToQuietHours = notifyTimeStr >= quietStart && notifyTimeStr < quietEnd;
              } else {
                // Wrap around midnight (e.g., 22:00 to 08:00)
                skipDueToQuietHours = notifyTimeStr >= quietStart || notifyTimeStr < quietEnd;
              }
            }

            if (skipDueToQuietHours) {
              continue;
            }

            // Determine channel(s)
            let channel = 'PUSH';
            if (minutesBefore === 5 && notificationSettings.enableSmsNotifications) {
              channel = 'SMS';
            } else if (minutesBefore >= 30 && notificationSettings.enableEmailNotifications) {
              channel = 'EMAIL';
            }

            // Create notification (using raw SQL)
            const notificationId = crypto.randomUUID();
            await prisma.$executeRaw`
              INSERT INTO "ShiftNotification" (
                "id", "deliveryProfileId", "scheduledFor", "notifyAt", "minutesBefore",
                "status", "channel", "dayOfWeek", "timeSlot", "createdAt", "updatedAt"
              )
              VALUES (
                ${notificationId}, ${profile.id}, ${shiftTime}, ${notifyAt}, ${minutesBefore},
                'PENDING', ${channel}, ${dayOfWeek}, ${timeSlot}, ${new Date()}, ${new Date()}
              )
            `;

            scheduledCount++;
          }
        }
      }
    }
    return NextResponse.json({
      success: true,
      scheduled: scheduledCount,
      profiles: profiles.length
    });
  } catch (error) {
    console.error('❌ Error scheduling shift notifications:', error);
    return NextResponse.json(
      { error: 'Failed to schedule notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

