import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This cron runs every hour to schedule shift notifications for the next 48 hours
export async function GET(req: NextRequest) {
  try {
    console.log('🔧 Starting shift notification scheduling...');

    const now = new Date();
    const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Get all active delivery profiles with notification settings
    const profiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true,
        notificationSettings: {
          OR: [
            { enablePushNotifications: true },
            { enableEmailNotifications: true },
            { enableSmsNotifications: true }
          ]
        }
      },
      include: {
        notificationSettings: true
      }
    });

    console.log(`📊 Found ${profiles.length} active delivery profiles`);

    let scheduledCount = 0;

    for (const profile of profiles) {
      if (!profile.notificationSettings) continue;

      const reminders = profile.notificationSettings.shiftReminders as number[];
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

            // Check if notification already exists
            const existing = await prisma.shiftNotification.findFirst({
              where: {
                deliveryProfileId: profile.id,
                scheduledFor: shiftTime,
                minutesBefore,
                status: { in: ['PENDING', 'SENT'] }
              }
            });

            if (existing) continue;

            // Check quiet hours
            let skipDueToQuietHours = false;
            if (profile.notificationSettings.quietHoursEnabled && 
                profile.notificationSettings.quietHoursStart && 
                profile.notificationSettings.quietHoursEnd) {
              const notifyHour = notifyAt.getHours();
              const notifyMinute = notifyAt.getMinutes();
              const notifyTimeStr = `${String(notifyHour).padStart(2, '0')}:${String(notifyMinute).padStart(2, '0')}`;
              
              const quietStart = profile.notificationSettings.quietHoursStart;
              const quietEnd = profile.notificationSettings.quietHoursEnd;

              if (quietStart < quietEnd) {
                // Normal range (e.g., 22:00 to 08:00)
                skipDueToQuietHours = notifyTimeStr >= quietStart && notifyTimeStr < quietEnd;
              } else {
                // Wrap around midnight (e.g., 22:00 to 08:00)
                skipDueToQuietHours = notifyTimeStr >= quietStart || notifyTimeStr < quietEnd;
              }
            }

            if (skipDueToQuietHours) {
              console.log(`⏰ Skipping notification due to quiet hours: ${notifyAt.toISOString()}`);
              continue;
            }

            // Determine channel(s)
            let channel = 'PUSH';
            if (minutesBefore === 5 && profile.notificationSettings.enableSmsNotifications) {
              channel = 'SMS';
            } else if (minutesBefore >= 30 && profile.notificationSettings.enableEmailNotifications) {
              channel = 'EMAIL';
            }

            // Create notification
            await prisma.shiftNotification.create({
              data: {
                deliveryProfileId: profile.id,
                scheduledFor: shiftTime,
                notifyAt,
                minutesBefore,
                status: 'PENDING',
                channel,
                dayOfWeek: dayOfWeek,
                timeSlot: timeSlot
              }
            });

            scheduledCount++;
          }
        }
      }
    }

    console.log(`✅ Scheduled ${scheduledCount} shift notifications`);

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

