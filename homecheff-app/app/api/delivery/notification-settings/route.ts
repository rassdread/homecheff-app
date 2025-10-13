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

    // Get delivery profile with notification settings
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      include: {
        notificationSettings: true
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // Create default settings if they don't exist
    if (!deliveryProfile.notificationSettings) {
      const defaultSettings = await prisma.deliveryNotificationSettings.create({
        data: {
          deliveryProfileId: deliveryProfile.id,
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          shiftReminders: [60, 30, 5],
          autoGoOnline: false,
          quietHoursEnabled: false
        }
      });

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ 
      settings: {
        ...deliveryProfile.notificationSettings,
        shiftReminders: deliveryProfile.notificationSettings.shiftReminders as number[]
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

    // Upsert notification settings
    const updatedSettings = await prisma.deliveryNotificationSettings.upsert({
      where: { deliveryProfileId: deliveryProfile.id },
      create: {
        deliveryProfileId: deliveryProfile.id,
        enablePushNotifications: enablePushNotifications ?? true,
        enableEmailNotifications: enableEmailNotifications ?? true,
        enableSmsNotifications: enableSmsNotifications ?? false,
        shiftReminders: shiftReminders ?? [60, 30, 5],
        autoGoOnline: autoGoOnline ?? false,
        quietHoursEnabled: quietHoursEnabled ?? false,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null
      },
      update: {
        enablePushNotifications: enablePushNotifications !== undefined ? enablePushNotifications : undefined,
        enableEmailNotifications: enableEmailNotifications !== undefined ? enableEmailNotifications : undefined,
        enableSmsNotifications: enableSmsNotifications !== undefined ? enableSmsNotifications : undefined,
        shiftReminders: shiftReminders !== undefined ? shiftReminders : undefined,
        autoGoOnline: autoGoOnline !== undefined ? autoGoOnline : undefined,
        quietHoursEnabled: quietHoursEnabled !== undefined ? quietHoursEnabled : undefined,
        quietHoursStart: quietHoursStart !== undefined ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnd !== undefined ? quietHoursEnd : undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...updatedSettings,
        shiftReminders: updatedSettings.shiftReminders as number[]
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

