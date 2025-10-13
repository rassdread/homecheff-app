/**
 * Unified Notification Service
 * 
 * Abstract layer that supports multiple channels:
 * - Pusher (in-app, web) - Current
 * - Email (backup, always reliable)
 * - FCM (Firebase Cloud Messaging) - Future mobile
 * - Web Push (browser notifications) - Future
 * - SMS (optional, critical only)
 */

import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

// Platform detection helper
export const Platform = {
  isWeb: () => typeof window !== 'undefined' && !(window as any).Capacitor,
  isMobile: () => typeof window !== 'undefined' && !!(window as any).Capacitor,
  isAndroid: () => (window as any).Capacitor?.getPlatform?.() === 'android',
  isIOS: () => (window as any).Capacitor?.getPlatform?.() === 'ios',
};

export interface NotificationMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  urgent?: boolean;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  icon?: string;
  badge?: string;
}

export interface NotificationOptions {
  userId: string;
  message: NotificationMessage;
  channels?: Array<'push' | 'email' | 'sms'>;
  saveToDatabase?: boolean;
}

/**
 * Main notification service
 */
export class NotificationService {
  /**
   * Send notification via all configured channels
   */
  static async send(options: NotificationOptions): Promise<void> {
    const { userId, message, channels = ['push', 'email'], saveToDatabase = true } = options;

    // Get user's push tokens and preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        DeliveryProfile: true
      }
    });
    
    // Get push tokens separately (for future mobile support)
    const pushTokens = await prisma.$queryRaw<any[]>`
      SELECT * FROM "PushToken" 
      WHERE "userId" = ${userId} AND "isActive" = true
    `.catch(() => [] as any[]);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Get general notification preferences
    const userPreferences = await prisma.$queryRaw<any[]>`
      SELECT * FROM "NotificationPreferences" 
      WHERE "userId" = ${userId}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);
    
    // Get delivery-specific notification settings
    let deliverySettings: any = null;
    if (user.DeliveryProfile) {
      deliverySettings = await prisma.$queryRaw<any[]>`
        SELECT * FROM "DeliveryNotificationSettings" 
        WHERE "deliveryProfileId" = ${user.DeliveryProfile.id}
        LIMIT 1
      `.then(rows => rows[0]).catch(() => null);
    }

    // Check quiet hours
    if (this.isQuietHours(userPreferences)) {
      console.log(`⏰ User ${userId} is in quiet hours, skipping non-urgent notifications`);
      if (!message.urgent) {
        return; // Skip non-urgent notifications during quiet hours
      }
    }

    const results: Array<{ channel: string; success: boolean; error?: string }> = [];

    // 1. In-app Push (Pusher) - Always try first if user is online
    if (channels.includes('push')) {
      try {
        await this.sendPusherNotification(userId, message);
        results.push({ channel: 'pusher', success: true });
      } catch (error) {
        console.error('Pusher notification failed:', error);
        results.push({ 
          channel: 'pusher', 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // 2. Email - Reliable backup
    const emailEnabled = deliverySettings?.enableEmailNotifications || userPreferences?.emailNewMessages;
    if (channels.includes('email') && emailEnabled) {
      try {
        await this.sendEmailNotification(user.email, message);
        results.push({ channel: 'email', success: true });
      } catch (error) {
        console.error('Email notification failed:', error);
        results.push({ 
          channel: 'email', 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // 3. SMS - Critical only
    const smsEnabled = deliverySettings?.enableSmsNotifications || userPreferences?.smsOrderUpdates;
    if (channels.includes('sms') && 
        user.phoneNumber && 
        smsEnabled) {
      try {
        await this.sendSMSNotification(user.phoneNumber, message);
        results.push({ channel: 'sms', success: true });
      } catch (error) {
        console.error('SMS notification failed:', error);
        results.push({ 
          channel: 'sms', 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // 4. Mobile Push (FCM) - Future implementation
    if (pushTokens.length > 0) {
      for (const token of pushTokens) {
        if (token.type === 'FCM') {
          // TODO: Implement Firebase Cloud Messaging when mobile app is ready
          // await this.sendFCMNotification(token.token, message);
          console.log('FCM not yet implemented, token:', token.token);
        }
      }
    }

    // Save to database if requested
    if (saveToDatabase) {
      const notificationId = crypto.randomUUID();
      await prisma.notification.create({
        data: {
          id: notificationId,
          userId,
          type: 'ADMIN_NOTICE', // Use existing enum value for system notifications
          payload: {
            title: message.title,
            body: message.body,
            urgent: message.urgent,
            data: message.data,
            actions: message.actions
          }
        }
      }).catch(err => console.error('Failed to save notification to DB:', err));
    }

    // Log results
    console.log('📢 Notification sent:', {
      userId,
      title: message.title,
      results
    });
  }

  /**
   * Send via Pusher (current in-app system)
   */
  private static async sendPusherNotification(userId: string, message: NotificationMessage): Promise<void> {
    await pusherServer.trigger(
      `private-delivery-${userId}`,
      'notification',
      {
        ...message,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(email: string, message: NotificationMessage): Promise<void> {
    console.log('📧 Email would be sent to:', email, message.title);
    
    // TODO: When Resend is configured, uncomment:
    /*
    import { Resend } from 'resend';
    import { renderShiftReminderEmail, getShiftReminderSubject } from './email-templates';
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'HomeCheff <notificaties@homecheff.nl>',
      to: email,
      subject: message.title,
      html: renderShiftReminderEmail({
        recipientEmail: email,
        recipientName: 'Bezorger', // Get from user data
        minutesBefore: message.data?.minutesBefore || 0,
        shiftTime: message.data?.shiftTime || '',
        timeSlot: message.data?.timeSlot || '',
        dayOfWeek: message.data?.dayOfWeek || ''
      })
    });
    */
  }

  /**
   * Send SMS via Twilio (optional, for critical notifications)
   */
  private static async sendSMSNotification(phoneNumber: string, message: NotificationMessage): Promise<void> {
    // TODO: Implement Twilio SMS
    console.log('💬 SMS to:', phoneNumber, message.title);
    
    // Example implementation:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `${message.title}\n${message.body}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
  }

  /**
   * Send shift reminder specifically
   */
  static async sendShiftReminder(
    deliveryProfileId: string,
    minutesBefore: number,
    shiftDetails: {
      scheduledFor: Date;
      timeSlot: string;
      dayOfWeek: number;
    }
  ): Promise<void> {
    const profile = await prisma.deliveryProfile.findUnique({
      where: { id: deliveryProfileId },
      include: {
        user: true
      }
    });
    
    // Get notification settings separately
    const notificationSettings = await prisma.$queryRaw<any[]>`
      SELECT * FROM "DeliveryNotificationSettings" 
      WHERE "deliveryProfileId" = ${deliveryProfileId}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    if (!profile) {
      throw new Error(`Delivery profile ${deliveryProfileId} not found`);
    }

    const timeLabels: Record<number, string> = {
      120: '2 uur',
      60: '1 uur',
      30: '30 minuten',
      15: '15 minuten',
      10: '10 minuten',
      5: '5 minuten',
      0: 'nu'
    };

    const timeLabel = timeLabels[minutesBefore] || `${minutesBefore} minuten`;
    const isUrgent = minutesBefore <= 5;

    const message: NotificationMessage = {
      title: isUrgent 
        ? `🚨 Je shift begint over ${timeLabel}!` 
        : `⏰ Shift herinnering - ${timeLabel}`,
      body: `Je ${shiftDetails.timeSlot} shift begint ${minutesBefore === 0 ? 'nu' : `over ${timeLabel}`}. ${isUrgent ? 'Ga nu online!' : 'Tijd om je voor te bereiden.'}`,
      urgent: isUrgent,
      data: {
        type: 'SHIFT_REMINDER',
        shiftId: deliveryProfileId,
        scheduledFor: shiftDetails.scheduledFor.toISOString(),
        minutesBefore,
        actionUrl: '/bezorger?action=go-online'
      },
      actions: [
        { label: '🟢 Ga Online', action: 'GO_ONLINE' },
        { label: 'Bekijk Dashboard', action: 'VIEW_DASHBOARD' }
      ]
    };

    // Determine channels based on timing and settings
    const channels: Array<'push' | 'email' | 'sms'> = ['push'];
    
    if (minutesBefore >= 30 && notificationSettings?.enableEmailNotifications) {
      channels.push('email');
    }
    
    if (minutesBefore === 5 && notificationSettings?.enableSmsNotifications) {
      channels.push('sms');
    }

    await this.send({
      userId: profile.userId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Register push token (for future mobile support)
   */
  static async registerPushToken(
    userId: string,
    token: string,
    platform: 'web' | 'android' | 'ios',
    type: 'WEB_PUSH' | 'FCM' | 'APNS'
  ): Promise<void> {
    // Use raw SQL until Prisma client is regenerated
    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM "PushToken" WHERE "token" = ${token} LIMIT 1
    `.then(rows => rows[0]).catch(() => null);
    
    if (existing) {
      await prisma.$executeRaw`
        UPDATE "PushToken" 
        SET "isActive" = true, "lastUsedAt" = ${new Date()}, "updatedAt" = ${new Date()}
        WHERE "token" = ${token}
      `;
    } else {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "PushToken" ("id", "userId", "token", "platform", "type", "isActive", "lastUsedAt", "createdAt", "updatedAt")
        VALUES (${id}, ${userId}, ${token}, ${platform}, ${type}, true, ${new Date()}, ${new Date()}, ${new Date()})
      `;
    }
  }

  /**
   * Unregister push token
   */
  static async unregisterPushToken(token: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "PushToken" 
      SET "isActive" = false, "updatedAt" = ${new Date()}
      WHERE "token" = ${token}
    `;
  }

  /**
   * Send chat message notification
   */
  static async sendChatNotification(
    recipientId: string,
    senderId: string,
    messagePreview: string,
    conversationId: string
  ): Promise<void> {
    // Get recipient's notification preferences
    const preferences = await prisma.$queryRaw<any[]>`
      SELECT * FROM "NotificationPreferences" 
      WHERE "userId" = ${recipientId}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: {
        name: true,
        username: true,
        displayNameOption: true
      }
    });

    const senderName = sender?.name || sender?.username || 'Iemand';
    
    const message: NotificationMessage = {
      title: `💬 Nieuw bericht van ${senderName}`,
      body: preferences?.chatNotificationPreview ? messagePreview : 'Je hebt een nieuw bericht ontvangen',
      data: {
        type: 'NEW_MESSAGE',
        conversationId,
        senderId,
        actionUrl: `/messages?conversation=${conversationId}`
      },
      actions: [
        { label: 'Bekijk bericht', action: 'VIEW_MESSAGE' },
        { label: 'Beantwoord', action: 'REPLY' }
      ]
    };

    // Determine channels based on user preferences
    const channels: Array<'push' | 'email' | 'sms'> = [];
    
    if (preferences?.pushNewMessages !== false) {
      channels.push('push');
    }
    
    if (preferences?.emailNewMessages) {
      channels.push('email');
    }

    await this.send({
      userId: recipientId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isQuietHours(preferences: any): boolean {
    if (!preferences?.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const start = preferences.quietHoursStart || '22:00';
    const end = preferences.quietHoursEnd || '08:00';

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    // Handle same-day quiet hours (e.g., 13:00 to 15:00)
    return currentTime >= start && currentTime < end;
  }

  /**
   * Get user's notification preferences (create if not exists)
   */
  static async getUserPreferences(userId: string): Promise<any> {
    let preferences = await prisma.$queryRaw<any[]>`
      SELECT * FROM "NotificationPreferences" 
      WHERE "userId" = ${userId}
      LIMIT 1
    `.then(rows => rows[0]).catch(() => null);

    // Create default preferences if they don't exist
    if (!preferences) {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "NotificationPreferences" (
          "id", "userId", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${userId}, ${new Date()}, ${new Date()}
        )
      `;
      
      preferences = await prisma.$queryRaw<any[]>`
        SELECT * FROM "NotificationPreferences" 
        WHERE "userId" = ${userId}
        LIMIT 1
      `.then(rows => rows[0]);
    }

    return preferences;
  }
}

