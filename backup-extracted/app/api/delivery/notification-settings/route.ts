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

    // Get delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // Get notification settings separately
    const notificationSettings = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DeliveryNotificationSettings" 
      WHERE "deliveryProfileId" = ${deliveryProfile.id}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    // Create default settings if they don't exist
    if (!notificationSettings) {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "DeliveryNotificationSettings" (
          "id", "deliveryProfileId", "enablePushNotifications", "enableEmailNotifications", 
          "enableSmsNotifications", "shiftReminders", "autoGoOnline", "quietHoursEnabled",
          "createdAt", "updatedAt"
        )
        VALUES (
          ${id}, ${deliveryProfile.id}, true, true, false, '[60, 30, 5]', false, false,
          ${new Date()}, ${new Date()}
        )
      `;

      return NextResponse.json({ 
        settings: {
          id,
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          shiftReminders: [60, 30, 5],
          autoGoOnline: false,
          quietHoursEnabled: false
        }
      });
    }

    return NextResponse.json({ 
      settings: {
        ...notificationSettings,
        shiftReminders: JSON.parse(notificationSettings.shiftReminders || '[60, 30, 5]')
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
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
    const {
      enablePushNotifications,
      enableEmailNotifications,
      enableSmsNotifications,
      shiftReminders,
      autoGoOnline,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd
    } = body;

    // Validate shiftReminders
    if (shiftReminders && (!Array.isArray(shiftReminders) || shiftReminders.length < 2 || shiftReminders.length > 5)) {
      return NextResponse.json(
        { error: 'Shift reminders must be an array with 2-5 items' },
        { status: 400 }
      );
    }

    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // Check if settings exist
    const existingSettings = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DeliveryNotificationSettings" 
      WHERE "deliveryProfileId" = ${deliveryProfile.id}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    const remindersJson = JSON.stringify(shiftReminders ?? [60, 30, 5]);

    if (existingSettings) {
      // Update existing
      await prisma.$executeRaw`
        UPDATE "DeliveryNotificationSettings" 
        SET 
          "enablePushNotifications" = ${enablePushNotifications ?? existingSettings.enablePushNotifications},
          "enableEmailNotifications" = ${enableEmailNotifications ?? existingSettings.enableEmailNotifications},
          "enableSmsNotifications" = ${enableSmsNotifications ?? existingSettings.enableSmsNotifications},
          "shiftReminders" = ${remindersJson}::json,
          "autoGoOnline" = ${autoGoOnline ?? existingSettings.autoGoOnline},
          "quietHoursEnabled" = ${quietHoursEnabled ?? existingSettings.quietHoursEnabled},
          "quietHoursStart" = ${quietHoursStart ?? existingSettings.quietHoursStart},
          "quietHoursEnd" = ${quietHoursEnd ?? existingSettings.quietHoursEnd},
          "updatedAt" = ${new Date()}
        WHERE "deliveryProfileId" = ${deliveryProfile.id}
      `;
    } else {
      // Create new
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "DeliveryNotificationSettings" (
          "id", "deliveryProfileId", "enablePushNotifications", "enableEmailNotifications",
          "enableSmsNotifications", "shiftReminders", "autoGoOnline", "quietHoursEnabled",
          "quietHoursStart", "quietHoursEnd", "createdAt", "updatedAt"
        )
        VALUES (
          ${id}, ${deliveryProfile.id}, ${enablePushNotifications ?? true}, ${enableEmailNotifications ?? true},
          ${enableSmsNotifications ?? false}, ${remindersJson}::json, ${autoGoOnline ?? false}, ${quietHoursEnabled ?? false},
          ${quietHoursStart}, ${quietHoursEnd}, ${new Date()}, ${new Date()}
        )
      `;
    }

    // Fetch updated settings
    const updatedSettings = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DeliveryNotificationSettings" 
      WHERE "deliveryProfileId" = ${deliveryProfile.id}
      LIMIT 1
    `.then(rows => rows[0]);

    return NextResponse.json({
      success: true,
      settings: {
        ...updatedSettings,
        shiftReminders: JSON.parse(updatedSettings.shiftReminders || '[60, 30, 5]')
      }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

