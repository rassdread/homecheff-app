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
      if (!message.urgent) {
        return; // Skip non-urgent notifications during quiet hours
      }
    }

    const results: Array<{ channel: string; success: boolean; error?: string }> = [];

    // 1. In-app Push (Pusher) - Check specific preference based on notification type
    let pushEnabled = true; // Default to enabled
    if (userPreferences) {
      const notificationType = message.data?.type;
      switch (notificationType) {
        case 'NEW_MESSAGE':
        case 'MESSAGE_RECEIVED':
          pushEnabled = userPreferences.pushNewMessages !== false;
          break;
        case 'NEW_ORDER':
        case 'ORDER_PLACED':
          pushEnabled = userPreferences.pushNewOrders !== false;
          break;
        case 'ORDER_PAID':
        case 'PAYMENT_RECEIVED':
        case 'ORDER_STATUS_UPDATE':
        case 'ORDER_READY_FOR_PICKUP':
        case 'ORDER_READY_FOR_DELIVERY':
        case 'ORDER_DELIVERED':
        case 'ORDER_CANCELLED':
          pushEnabled = userPreferences.pushOrderUpdates !== false;
          break;
        case 'DELIVERY_ORDER_AVAILABLE':
        case 'DELIVERY_ACCEPTED':
        case 'DELIVERY_PICKED_UP':
        case 'DELIVERY_COMPLETED':
        case 'DELIVERY_COUNTDOWN_WARNING':
          pushEnabled = userPreferences.pushDeliveryUpdates !== false;
          break;
        case 'SECURITY_ALERT':
          pushEnabled = userPreferences.pushSecurityAlerts !== false;
          break;
        default:
          // Default: enabled if no specific preference found
          pushEnabled = true;
      }
    }
    
    if (channels.includes('push') && pushEnabled) {
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

    // 2. Email - Check specific preference based on notification type
    let emailEnabled = false;
    if (deliverySettings?.enableEmailNotifications) {
      emailEnabled = true; // Delivery settings override general preferences
    } else if (userPreferences) {
      // Check specific email preference based on notification type
      const notificationType = message.data?.type;
      switch (notificationType) {
        case 'NEW_MESSAGE':
        case 'MESSAGE_RECEIVED':
          emailEnabled = userPreferences.emailNewMessages !== false;
          break;
        case 'NEW_ORDER':
        case 'ORDER_PLACED':
          emailEnabled = userPreferences.emailNewOrders !== false;
          break;
        case 'ORDER_PAID':
        case 'PAYMENT_RECEIVED':
        case 'ORDER_STATUS_UPDATE':
        case 'ORDER_READY_FOR_PICKUP':
        case 'ORDER_DELIVERED':
        case 'ORDER_CANCELLED':
          emailEnabled = userPreferences.emailOrderUpdates !== false;
          break;
        case 'DELIVERY_ORDER_AVAILABLE':
        case 'DELIVERY_ACCEPTED':
        case 'DELIVERY_PICKED_UP':
        case 'DELIVERY_COMPLETED':
        case 'DELIVERY_COUNTDOWN_WARNING':
          emailEnabled = userPreferences.emailDeliveryUpdates !== false;
          break;
        case 'SECURITY_ALERT':
          emailEnabled = userPreferences.emailSecurityAlerts !== false;
          break;
        default:
          // Default: check if any email preference is enabled
          emailEnabled = userPreferences.emailNewMessages !== false || 
                        userPreferences.emailNewOrders !== false ||
                        userPreferences.emailOrderUpdates !== false ||
                        userPreferences.emailDeliveryUpdates !== false;
      }
    } else {
      // No preferences found, default to enabled
      emailEnabled = true;
    }
    
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

    // 3. SMS - Check specific preference based on notification type
    let smsEnabled = false;
    if (deliverySettings?.enableSmsNotifications) {
      smsEnabled = true; // Delivery settings override general preferences
    } else if (userPreferences && user.phoneNumber) {
      const notificationType = message.data?.type;
      switch (notificationType) {
        case 'ORDER_PAID':
        case 'PAYMENT_RECEIVED':
        case 'ORDER_STATUS_UPDATE':
        case 'ORDER_READY_FOR_PICKUP':
        case 'ORDER_DELIVERED':
        case 'ORDER_CANCELLED':
          smsEnabled = userPreferences.smsOrderUpdates === true;
          break;
        case 'DELIVERY_ORDER_AVAILABLE':
        case 'DELIVERY_ACCEPTED':
        case 'DELIVERY_PICKED_UP':
        case 'DELIVERY_COMPLETED':
        case 'DELIVERY_COUNTDOWN_WARNING':
          smsEnabled = userPreferences.smsDeliveryUpdates === true;
          break;
        case 'SECURITY_ALERT':
          smsEnabled = userPreferences.smsSecurityAlerts !== false;
          break;
        default:
          smsEnabled = false; // SMS only for specific types
      }
    }
    
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
        }
      }
    }

    // Save to database if requested
    if (saveToDatabase) {
      const notificationId = crypto.randomUUID();
      const notificationData = message.data || {};
      
      // Determine notification type from message data
      let notificationType: any = 'ADMIN_NOTICE';
      if (notificationData.type) {
        // Map data.type to NotificationType enum
        const typeMap: Record<string, any> = {
          'ORDER_PLACED': 'ORDER_RECEIVED',
          'ORDER_PAID': 'ORDER_CONFIRMED',
          'NEW_ORDER': 'ORDER_RECEIVED',
          'ORDER_STATUS_UPDATE': 'ORDER_UPDATE',
          'ORDER_CONFIRMED': 'ORDER_CONFIRMED',
          'ORDER_PROCESSING': 'ORDER_PROCESSING',
          'ORDER_SHIPPED': 'ORDER_SHIPPED',
          'ORDER_DELIVERED': 'ORDER_DELIVERED',
          'ORDER_CANCELLED': 'ORDER_CANCELLED',
          'DELIVERY_ORDER_AVAILABLE': 'DELIVERY_ACCEPTED',
          'DELIVERY_ACCEPTED': 'DELIVERY_ACCEPTED',
          'DELIVERY_PICKED_UP': 'DELIVERY_PICKED_UP',
          'DELIVERY_COMPLETED': 'DELIVERY_DELIVERED',
          'DELIVERY_CANCELLED': 'DELIVERY_CANCELLED',
          'DELIVERY_COUNTDOWN_WARNING': 'DELIVERY_WARNING',
          'NEW_MESSAGE': 'MESSAGE_RECEIVED',
          'ORDER_UPDATE': 'ORDER_UPDATE'
        };
        notificationType = typeMap[notificationData.type] || 'ADMIN_NOTICE';
      }

      // Build notification data - orderId/deliveryOrderId are optional and may not exist in DB yet
      const notificationCreateData: any = {
        id: notificationId,
        userId,
        type: notificationType,
        payload: {
          title: message.title,
          body: message.body,
          urgent: message.urgent,
          data: message.data,
          actions: message.actions,
          ...notificationData // Include all data in payload
        }
      };

      // Only add orderId/deliveryOrderId if columns exist in database (they're in payload anyway)
      // These will be added via migration later
      if (notificationData.orderId) {
        notificationCreateData.orderId = notificationData.orderId;
      }
      if (notificationData.deliveryOrderId) {
        notificationCreateData.deliveryOrderId = notificationData.deliveryOrderId;
      }

      await prisma.notification.create({
        data: notificationCreateData
      }).catch(err => {
        // If orderId/deliveryOrderId columns don't exist, try without them
        if (err.code === 'P2022' && (err.meta?.column?.includes('orderId') || err.meta?.column?.includes('deliveryOrderId'))) {
          // Retry without orderId/deliveryOrderId columns (data is in payload anyway)
          return prisma.notification.create({
            data: {
              id: notificationId,
              userId,
              type: notificationType,
              payload: notificationCreateData.payload
            }
          });
        }
        console.error('Failed to save notification to DB:', err);
        throw err;
      });
    }

    // Log results
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
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Convert newlines to <br> tags for HTML display
      const bodyHtml = message.body.replace(/\n/g, '<br>');
      
      // Special formatting for pickup/delivery address in order notifications
      let formattedBody = bodyHtml;
      if (message.data?.type === 'ORDER_READY_FOR_PICKUP' && message.data?.pickupAddress) {
        const addressParts = message.body.split('\n');
        if (addressParts.length > 1) {
          formattedBody = `
            <p>${addressParts[0]}</p>
            <div style="background: #f0f9ff; border-left: 4px solid #006D52; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">📍 Afhaaladres:</p>
              <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 16px; white-space: pre-line;">${message.data.pickupAddress}</p>
            </div>
          `;
        }
      } else if (message.data?.type === 'ORDER_READY_FOR_DELIVERY' && message.data?.deliveryAddress) {
        const addressParts = message.body.split('\n');
        if (addressParts.length > 1) {
          formattedBody = `
            <p>${addressParts[0]}</p>
            <div style="background: #f0fdf4; border-left: 4px solid #006D52; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">🚚 Bezorgadres:</p>
              <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 16px; white-space: pre-line;">${message.data.deliveryAddress}</p>
            </div>
          `;
        }
      }
      
      // Simple HTML email template
      const htmlEmail = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${message.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #006D52 0%, #005843 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #006D52 0%, #005843 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #6b7280; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${message.title}</h1>
            </div>
            <div class="content">
              ${formattedBody}
              ${message.data?.link ? `<a href="${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}${message.data.link}" class="button">Bekijk Bestelling</a>` : ''}
            </div>
            <div class="footer">
              <p>Met vriendelijke groet,<br>Het HomeCheff Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      await resend.emails.send({
        from: 'HomeCheff <noreply@homecheff.nl>',
        to: email,
        subject: message.title,
        html: htmlEmail
      });
    } catch (error) {
      console.error('Email notification error:', error);
      // Don't throw - email is optional
    }
  }

  /**
   * Send SMS via Twilio (optional, for critical notifications)
   */
  private static async sendSMSNotification(phoneNumber: string, message: NotificationMessage): Promise<void> {
    // Check if Twilio is configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn('⚠️ Twilio not configured. SMS notifications disabled.');
      return;
    }

    try {
      // Dynamic import to avoid loading Twilio if not needed
      const twilio = await import('twilio');
      const client = twilio.default(twilioAccountSid, twilioAuthToken);
      
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+31${phoneNumber.replace(/^0/, '')}`;
      
      await client.messages.create({
        body: `${message.title}\n\n${message.body}${message.data?.link ? `\n\n${message.data.link}` : ''}`,
        from: twilioPhoneNumber,
        to: formattedPhone
      });

      console.log(`✅ SMS sent to ${formattedPhone}`);
    } catch (error) {
      console.error('❌ Twilio SMS error:', error);
      throw error;
    }
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

  // ============================================
  // ORDER NOTIFICATIONS
  // ============================================

  /**
   * Send notification when order is placed (to buyer)
   */
  static async sendOrderPlacedNotification(buyerId: string, orderId: string, orderNumber: string): Promise<void> {
    const message: NotificationMessage = {
      title: '✅ Bestelling geplaatst!',
      body: `Je bestelling #${orderNumber} is geplaatst en wordt verwerkt.`,
      data: {
        type: 'ORDER_PLACED',
        orderId,
        orderNumber,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' }
      ]
    };

    await this.send({
      userId: buyerId,
      message,
      channels: ['push', 'email'],
      saveToDatabase: true
    });
  }

  /**
   * Send notification when order payment is received (to buyer and seller)
   */
  static async sendOrderPaidNotification(buyerId: string, sellerId: string, orderId: string, orderNumber: string, totalAmount: number): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '💳 Betaling ontvangen',
      body: `Je betaling voor bestelling #${orderNumber} is ontvangen. De bestelling wordt nu voorbereid.`,
      data: {
        type: 'ORDER_PAID',
        orderId,
        orderNumber,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Volg bestelling', action: 'TRACK_ORDER' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '💰 Betaling ontvangen',
      body: `Betaling ontvangen voor bestelling #${orderNumber} (€${(totalAmount / 100).toFixed(2)}).`,
      urgent: true,
      data: {
        type: 'PAYMENT_RECEIVED',
        orderId,
        orderNumber,
        totalAmount,
        link: `/verkoper/orders`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' }
      ]
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send notification when new order is received (to seller)
   */
  static async sendNewOrderNotification(sellerId: string, orderId: string, orderNumber: string, buyerName: string, totalAmount: number): Promise<void> {
    const message: NotificationMessage = {
      title: '📦 Nieuwe bestelling ontvangen!',
      body: `${buyerName} heeft een bestelling geplaatst (€${(totalAmount / 100).toFixed(2)}). Bestelling #${orderNumber}.`,
      urgent: true,
      data: {
        type: 'NEW_ORDER',
        orderId,
        orderNumber,
        buyerName,
        totalAmount,
        link: `/verkoper/orders`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' },
        { label: 'Chat met koper', action: 'CHAT_BUYER' }
      ]
    };

    // Check if seller has SMS notifications enabled in preferences
    const preferences = await this.getUserPreferences(sellerId);
    const channels: Array<'push' | 'email' | 'sms'> = ['push', 'email'];
    
    // Add SMS if seller has enabled it in preferences
    if (preferences?.smsOrderUpdates) {
      channels.push('sms');
    }

    await this.send({
      userId: sellerId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Send notification when shipping label is ready (for SHIPPING orders)
   */
  static async sendShippingLabelReadyNotification(sellerId: string, orderId: string, orderNumber: string, trackingNumber: string): Promise<void> {
    const message: NotificationMessage = {
      title: '📦 Verzendlabel klaar!',
      body: `Het verzendlabel voor bestelling #${orderNumber} is klaar. Print het label en post het pakket.`,
      urgent: true,
      data: {
        type: 'SHIPPING_LABEL_READY',
        orderId,
        orderNumber,
        trackingNumber,
        link: `/verkoper/orders`
      },
      actions: [
        { label: 'Bekijk label', action: 'VIEW_LABEL' },
        { label: 'Naar orders', action: 'VIEW_ORDERS' }
      ]
    };

    // Check if seller has SMS notifications enabled in preferences
    const preferences = await this.getUserPreferences(sellerId);
    const channels: Array<'push' | 'email' | 'sms'> = ['push', 'email'];
    
    // Add SMS if seller has enabled it in preferences
    if (preferences?.smsOrderUpdates) {
      channels.push('sms');
    }

    await this.send({
      userId: sellerId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Send notification when order is ready for pickup (without delivery)
   */
  static async sendOrderReadyForPickupNotification(buyerId: string, sellerId: string, orderId: string, orderNumber: string, pickupAddress: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '📦 Bestelling klaar voor ophalen',
      body: `Je bestelling #${orderNumber} is klaar! Je kunt het ophalen bij:\n${pickupAddress}`,
      data: {
        type: 'ORDER_READY_FOR_PICKUP',
        orderId,
        orderNumber,
        pickupAddress,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' },
        { label: 'Chat met verkoper', action: 'CHAT_SELLER' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '✅ Bestelling klaar',
      body: `Bestelling #${orderNumber} is klaar. De klant kan het nu ophalen.`,
      data: {
        type: 'ORDER_READY',
        orderId,
        orderNumber,
        link: `/verkoper/orders`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send notification when order is ready for delivery (with delivery address)
   */
  static async sendOrderReadyForDeliveryNotification(buyerId: string, sellerId: string, orderId: string, orderNumber: string, deliveryAddress: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '🚚 Bestelling klaar voor bezorging',
      body: `Je bestelling #${orderNumber} is klaar! Het wordt bezorgd naar:\n${deliveryAddress}`,
      data: {
        type: 'ORDER_READY_FOR_DELIVERY',
        orderId,
        orderNumber,
        deliveryAddress,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' },
        { label: 'Chat met verkoper', action: 'CHAT_SELLER' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '✅ Bestelling klaar',
      body: `Bestelling #${orderNumber} is klaar. De bestelling wordt nu bezorgd.`,
      data: {
        type: 'ORDER_READY',
        orderId,
        orderNumber,
        link: `/verkoper/orders`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send notification when order is delivered
   */
  static async sendOrderDeliveredNotification(buyerId: string, sellerId: string, orderId: string, orderNumber: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '🎉 Bestelling bezorgd!',
      body: `Je bestelling #${orderNumber} is succesvol bezorgd. Bedankt voor je aankoop!`,
      data: {
        type: 'ORDER_DELIVERED',
        orderId,
        orderNumber,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Schrijf review', action: 'WRITE_REVIEW' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '✅ Bestelling bezorgd',
      body: `Bestelling #${orderNumber} is succesvol bezorgd aan de klant.`,
      data: {
        type: 'ORDER_DELIVERED',
        orderId,
        orderNumber,
        link: `/verkoper/orders`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send notification when order status is updated
   */
  static async sendOrderStatusUpdateNotification(userId: string, orderId: string, orderNumber: string, newStatus: string, statusLabel: string): Promise<void> {
    const message: NotificationMessage = {
      title: `📦 Bestelling ${statusLabel}`,
      body: `De status van bestelling #${orderNumber} is bijgewerkt naar: ${statusLabel}`,
      data: {
        type: 'ORDER_STATUS_UPDATE',
        orderId,
        orderNumber,
        newStatus,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Bekijk bestelling', action: 'VIEW_ORDER' }
      ]
    };

    await this.send({
      userId,
      message,
      channels: ['push'],
      saveToDatabase: true
    });
  }

  /**
   * Send notification when order is cancelled
   */
  static async sendOrderCancelledNotification(buyerId: string, sellerId: string, orderId: string, orderNumber: string, reason?: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '❌ Bestelling geannuleerd',
      body: `Je bestelling #${orderNumber} is geannuleerd.${reason ? ` Reden: ${reason}` : ''}`,
      urgent: true,
      data: {
        type: 'ORDER_CANCELLED',
        orderId,
        orderNumber,
        reason,
        link: `/orders/${orderId}`
      }
    };

    const sellerMessage: NotificationMessage = {
      title: '❌ Bestelling geannuleerd',
      body: `Bestelling #${orderNumber} is geannuleerd.${reason ? ` Reden: ${reason}` : ''}`,
      urgent: true,
      data: {
        type: 'ORDER_CANCELLED',
        orderId,
        orderNumber,
        reason,
        link: `/verkoper/orders`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  // ============================================
  // DELIVERY NOTIFICATIONS
  // ============================================

  /**
   * Send notification when delivery order is available (to deliverers)
   */
  static async sendDeliveryOrderAvailableNotification(delivererId: string, deliveryOrderId: string, orderId: string, orderNumber: string, deliveryFee: number, distance: number, estimatedTime: number): Promise<void> {
    const message: NotificationMessage = {
      title: '🔔 Nieuwe bezorgopdracht beschikbaar!',
      body: `Nieuwe bezorgopdracht #${orderNumber} in jouw gebied! Afstand: ${distance.toFixed(1)}km, Verdiensten: €${(deliveryFee / 100).toFixed(2)}`,
      urgent: true,
      data: {
        type: 'DELIVERY_ORDER_AVAILABLE',
        deliveryOrderId,
        orderId,
        orderNumber,
        deliveryFee,
        distance,
        estimatedTime,
        link: `/bezorger/dashboard`
      },
      actions: [
        { label: 'Accepteer opdracht', action: 'ACCEPT_DELIVERY' },
        { label: 'Bekijk details', action: 'VIEW_DELIVERY' }
      ]
    };

    await this.send({
      userId: delivererId,
      message,
      channels: ['push', 'email'],
      saveToDatabase: true
    });
  }

  /**
   * Send notification when delivery is accepted
   */
  static async sendDeliveryAcceptedNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string, orderNumber: string, delivererName: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '🚚 Bezorger toegewezen',
      body: `${delivererName} heeft je bestelling #${orderNumber} geaccepteerd. Je bestelling wordt binnen 3 uur bezorgd.`,
      data: {
        type: 'DELIVERY_ACCEPTED',
        orderId,
        orderNumber,
        delivererName,
        link: `/orders/${orderId}/tracking`
      },
      actions: [
        { label: 'Volg bezorging', action: 'TRACK_DELIVERY' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '🚚 Bezorger toegewezen',
      body: `Bezorger ${delivererName} heeft bestelling #${orderNumber} geaccepteerd.`,
      data: {
        type: 'DELIVERY_ACCEPTED',
        orderId,
        orderNumber,
        delivererName,
        link: `/verkoper/orders`
      }
    };

    const delivererMessage: NotificationMessage = {
      title: '✅ Opdracht geaccepteerd',
      body: `Je hebt bezorgopdracht #${orderNumber} geaccepteerd. Je hebt 3 uur om te bezorgen.`,
      data: {
        type: 'DELIVERY_ACCEPTED',
        orderId,
        orderNumber,
        link: `/bezorger/dashboard`
      },
      actions: [
        { label: 'Bekijk opdracht', action: 'VIEW_DELIVERY' }
      ]
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: delivererId,
        message: delivererMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send notification when delivery countdown warning is triggered
   */
  static async sendDeliveryCountdownWarning(delivererId: string, deliveryOrderId: string, orderId: string, orderNumber: string, minutesRemaining: number): Promise<void> {
    const isUrgent = minutesRemaining <= 5;
    const timeLabel = minutesRemaining === 30 ? '30 minuten' : minutesRemaining === 15 ? '15 minuten' : '5 minuten';

    const message: NotificationMessage = {
      title: isUrgent 
        ? `🚨 Urgent: ${timeLabel} resterend!` 
        : `⏰ Waarschuwing: ${timeLabel} resterend`,
      body: `Je hebt nog ${timeLabel} om bestelling #${orderNumber} te bezorgen.${isUrgent ? ' Haast je!' : ''}`,
      urgent: isUrgent,
      data: {
        type: 'DELIVERY_COUNTDOWN_WARNING',
        deliveryOrderId,
        orderId,
        orderNumber,
        minutesRemaining,
        link: `/bezorger/dashboard`
      },
      actions: [
        { label: 'Bekijk opdracht', action: 'VIEW_DELIVERY' }
      ]
    };

    const channels: Array<'push' | 'email' | 'sms'> = ['push'];
    if (isUrgent) {
      channels.push('sms'); // SMS voor urgente waarschuwingen
    }

    await this.send({
      userId: delivererId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Send notification when delivery is picked up
   */
  static async sendDeliveryPickedUpNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string, orderNumber: string): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '📦 Bestelling opgehaald',
      body: `Je bestelling #${orderNumber} is opgehaald en onderweg naar jou!`,
      data: {
        type: 'DELIVERY_PICKED_UP',
        orderId,
        orderNumber,
        link: `/orders/${orderId}/tracking`
      },
      actions: [
        { label: 'Volg bezorging', action: 'TRACK_DELIVERY' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '📦 Product opgehaald',
      body: `Je product voor bestelling #${orderNumber} is opgehaald door de bezorger.`,
      data: {
        type: 'DELIVERY_PICKED_UP',
        orderId,
        orderNumber,
        link: `/verkoper/orders`
      }
    };

    const delivererMessage: NotificationMessage = {
      title: '✅ Product opgehaald',
      body: `Product opgehaald voor bestelling #${orderNumber}. Ga nu naar het bezorgadres.`,
      data: {
        type: 'DELIVERY_PICKED_UP',
        orderId,
        orderNumber,
        link: `/bezorger/dashboard`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: delivererId,
        message: delivererMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }

  /**
   * Send order notification (generic method for order status updates)
   */
  static async sendOrderNotification(
    recipientId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      'CONFIRMED': 'Bevestigd',
      'PROCESSING': 'In behandeling',
      'SHIPPED': 'Verzonden',
      'DELIVERED': 'Bezorgd',
      'CANCELLED': 'Geannuleerd'
    };

    const statusIcons: Record<string, string> = {
      'CONFIRMED': '✅',
      'PROCESSING': '🔄',
      'SHIPPED': '🚚',
      'DELIVERED': '🎉',
      'CANCELLED': '❌'
    };

    const statusLabel = statusLabels[status] || status;
    const icon = statusIcons[status] || '📦';

    const message: NotificationMessage = {
      title: `${icon} Bestelling ${statusLabel}`,
      body: `De status van bestelling #${orderNumber} is bijgewerkt naar: ${statusLabel}`,
      urgent: status === 'CANCELLED' || status === 'DELIVERED',
      data: {
        type: `ORDER_${status}`,
        orderId,
        orderNumber,
        status,
        link: `/orders/${orderId}`,
        ...additionalData
      },
      actions: [
        { label: 'Bekijk bestelling', action: `/orders/${orderId}` }
      ]
    };

    const preferences = await this.getUserPreferences(recipientId);
    const channels: Array<'push' | 'email' | 'sms'> = [];

    if (preferences?.pushOrderUpdates !== false) {
      channels.push('push');
    }
    if (preferences?.emailOrderUpdates) {
      channels.push('email');
    }
    if (preferences?.smsOrderUpdates && message.urgent) {
      channels.push('sms');
    }

    await this.send({
      userId: recipientId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Send delivery notification (generic method for delivery status updates)
   */
  static async sendDeliveryNotification(
    recipientId: string,
    deliveryOrderId: string,
    orderNumber: string,
    status: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      'PENDING': 'Wachtend',
      'ACCEPTED': 'Geaccepteerd',
      'PICKED_UP': 'Opgehaald',
      'DELIVERED': 'Bezorgd',
      'CANCELLED': 'Geannuleerd',
      'WARNING': 'Waarschuwing'
    };

    const statusIcons: Record<string, string> = {
      'PENDING': '⏳',
      'ACCEPTED': '✅',
      'PICKED_UP': '📦',
      'DELIVERED': '🎉',
      'CANCELLED': '❌',
      'WARNING': '⚠️'
    };

    const statusLabel = statusLabels[status] || status;
    const icon = statusIcons[status] || '🚚';

    const message: NotificationMessage = {
      title: `${icon} Bezorging ${statusLabel}`,
      body: `De status van bezorging #${orderNumber} is bijgewerkt naar: ${statusLabel}`,
      urgent: status === 'ACCEPTED' || status === 'CANCELLED' || status === 'WARNING',
      data: {
        type: `DELIVERY_${status}`,
        deliveryOrderId,
        orderNumber,
        status,
        link: `/delivery/dashboard`,
        ...additionalData
      },
      actions: [
        { label: 'Bekijk opdracht', action: `/delivery/dashboard` }
      ]
    };

    const preferences = await this.getUserPreferences(recipientId);
    const channels: Array<'push' | 'email' | 'sms'> = [];

    if (preferences?.pushDeliveryUpdates !== false) {
      channels.push('push');
    }
    if (preferences?.emailDeliveryUpdates) {
      channels.push('email');
    }
    if (preferences?.smsDeliveryUpdates && message.urgent) {
      channels.push('sms');
    }

    await this.send({
      userId: recipientId,
      message,
      channels,
      saveToDatabase: true
    });
  }

  /**
   * Send notification when delivery is completed
   */
  static async sendDeliveryCompletedNotification(buyerId: string, sellerId: string, delivererId: string, orderId: string, orderNumber: string, deliveryFee: number): Promise<void> {
    const buyerMessage: NotificationMessage = {
      title: '🎉 Bestelling bezorgd!',
      body: `Je bestelling #${orderNumber} is succesvol bezorgd. Bedankt voor je aankoop!`,
      data: {
        type: 'DELIVERY_COMPLETED',
        orderId,
        orderNumber,
        link: `/orders/${orderId}`
      },
      actions: [
        { label: 'Schrijf review', action: 'WRITE_REVIEW' }
      ]
    };

    const sellerMessage: NotificationMessage = {
      title: '✅ Bestelling bezorgd',
      body: `Bestelling #${orderNumber} is succesvol bezorgd aan de klant.`,
      data: {
        type: 'DELIVERY_COMPLETED',
        orderId,
        orderNumber,
        link: `/verkoper/orders`
      }
    };

    const delivererMessage: NotificationMessage = {
      title: '✅ Bezorging voltooid!',
      body: `Je hebt bestelling #${orderNumber} succesvol bezorgd. Verdiensten: €${(deliveryFee / 100).toFixed(2)}`,
      data: {
        type: 'DELIVERY_COMPLETED',
        orderId,
        orderNumber,
        deliveryFee,
        link: `/bezorger/dashboard`
      }
    };

    await Promise.all([
      this.send({
        userId: buyerId,
        message: buyerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: sellerId,
        message: sellerMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      }),
      this.send({
        userId: delivererId,
        message: delivererMessage,
        channels: ['push', 'email'],
        saveToDatabase: true
      })
    ]);
  }
}

