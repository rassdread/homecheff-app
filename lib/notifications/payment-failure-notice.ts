import type { PrismaClient } from '@prisma/client';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { NotificationService } from '@/lib/notifications/notification-service';
import {
  courierRequestChannels,
  PAYMENT_FAILED_COPY,
  paymentFailureTarget,
  shouldSendBookingNotice,
} from '@/lib/delivery/booking-notice';

export { paymentFailureTarget };

/** Stripe has confirmed the payment failed. Does not create an order. */
export async function notifyBuyerPaymentFailed(
  prisma: PrismaClient,
  input: { buyerId: string; eventId: string },
): Promise<void> {
  const target = paymentFailureTarget({ buyerId: input.buyerId }, input.eventId);
  if (!target) return;
  try {
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Notification"
      WHERE "userId" = ${target.buyerId}
        AND payload->'data'->>'paymentFailureId' = ${target.eventId}
      LIMIT 1
    `.catch(() => []);
    if (!shouldSendBookingNotice(existing.length > 0)) return;
    const tokens = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "PushToken"
      WHERE "userId" = ${target.buyerId} AND "isActive" = true
      LIMIT 1
    `.catch(() => []);
    await NotificationService.send({
      userId: target.buyerId,
      message: {
        title: PAYMENT_FAILED_COPY.title,
        body: PAYMENT_FAILED_COPY.body,
        urgent: true,
        data: {
          type: 'PAYMENT_FAILED',
          paymentFailureId: target.eventId,
          link: '/checkout',
          actionUrl: '/checkout',
        },
      },
      channels: courierRequestChannels(tokens.length > 0),
      saveToDatabase: true,
      emailIdempotencyKey: `payment-failed:${target.eventId}:${target.buyerId}`,
      emailPriority: EMAIL_PRIORITY.P0,
    });
  } catch (error) {
    console.warn('[payment] failure notice failed', error);
  }
}
