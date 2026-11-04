import type { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { RESERVATION_COPY } from '@/lib/products/checkout-reservation-policy';
import {
  bookingNoticeKey,
  bookingRequestDeepLink,
  courierRequestChannels,
  shouldSendBookingNotice,
  type BookingNoticeEvent,
} from '@/lib/delivery/booking-notice';

/** Buyer notices for the courier hold. Failure must not change the reservation. */
export async function notifyReservationBuyer(
  userId: string | null | undefined,
  kind: 'accepted' | 'rejected' | 'expired',
  options?: { bookingRequestId?: string; prisma?: PrismaClient },
) {
  if (!userId) return;
  const copy = RESERVATION_COPY.nl;
  const body =
    kind === 'accepted' ? copy.accepted : kind === 'rejected' ? copy.rejected : copy.expired;
  const event: BookingNoticeEvent =
    kind === 'accepted' ? 'buyer_accepted' : kind === 'rejected' ? 'buyer_rejected' : 'buyer_expired';
  const bookingRequestId = options?.bookingRequestId;
  try {
    if (options?.prisma && bookingRequestId) {
      const existing = await options.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Notification"
        WHERE "userId" = ${userId}
          AND payload->'data'->>'bookingRequestId' = ${bookingRequestId}
          AND payload->'data'->>'noticeEvent' = ${event}
        LIMIT 1
      `.catch(() => []);
      if (!shouldSendBookingNotice(existing.length > 0)) return;
    }
    let channels: Array<'push' | 'email'> = ['push'];
    if (options?.prisma) {
      const tokens = await options.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "PushToken"
        WHERE "userId" = ${userId} AND "isActive" = true
        LIMIT 1
      `.catch(() => []);
      channels = courierRequestChannels({ hasActivePushToken: tokens.length > 0 });
    }
    const link = bookingRequestId ? bookingRequestDeepLink(bookingRequestId) : '/checkout';
    await NotificationService.send({
      userId,
      message: {
        title: body,
        body,
        urgent: kind !== 'accepted',
        data: {
          type: 'CHECKOUT_RESERVATION',
          kind,
          bookingRequestId,
          noticeEvent: event,
          link,
          actionUrl: link,
          titleEn:
            kind === 'accepted'
              ? RESERVATION_COPY.en.accepted
              : kind === 'rejected'
                ? RESERVATION_COPY.en.rejected
                : RESERVATION_COPY.en.expired,
        },
      },
      channels,
      saveToDatabase: true,
      emailIdempotencyKey: bookingRequestId
        ? bookingNoticeKey(bookingRequestId, event)
        : undefined,
      emailPriority: EMAIL_PRIORITY.P1,
    });
  } catch (error) {
    console.warn('[reservation] notification failed', kind, error);
  }
}
