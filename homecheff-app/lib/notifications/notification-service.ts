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
        pushTokens: {
          where: { isActive: true }
        },
        DeliveryProfile: {
          include: {
            notificationSettings: true
          }
        }
      }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
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
    if (channels.includes('email') && user.DeliveryProfile?.notificationSettings?.enableEmailNotifications) {
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
    if (channels.includes('sms') && 
        user.phoneNumber && 
        user.DeliveryProfile?.notificationSettings?.enableSmsNotifications) {
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
    if (user.pushTokens.length > 0) {
      for (const token of user.pushTokens) {
        if (token.type === 'FCM') {
          // TODO: Implement Firebase Cloud Messaging when mobile app is ready
          // await this.sendFCMNotification(token.token, message);
          console.log('FCM not yet implemented, token:', token.token);
        }
      }
    }

    // Save to database if requested
    if (saveToDatabase) {
      await prisma.notification.create({
        data: {
          userId,
          title: message.title,
          body: message.body,
          type: message.urgent ? 'URGENT' : 'INFO',
          read: false,
          actionUrl: message.data?.actionUrl
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
        user: true,
        notificationSettings: true
      }
    });

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
    
    if (minutesBefore >= 30 && profile.notificationSettings?.enableEmailNotifications) {
      channels.push('email');
    }
    
    if (minutesBefore === 5 && profile.notificationSettings?.enableSmsNotifications) {
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
    await prisma.pushToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        type,
        isActive: true,
        lastUsedAt: new Date()
      },
      update: {
        isActive: true,
        lastUsedAt: new Date()
      }
    });
  }

  /**
   * Unregister push token
   */
  static async unregisterPushToken(token: string): Promise<void> {
    await prisma.pushToken.update({
      where: { token },
      data: { isActive: false }
    });
  }
}

