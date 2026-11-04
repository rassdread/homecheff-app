import type { PrismaClient } from '@prisma/client';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { NotificationService } from '@/lib/notifications/notification-service';
import {
  bookingNoticeKey,
  bookingRequestDeepLink,
  COURIER_CANCELLED_COPY,
  COURIER_EXPIRED_COPY,
  COURIER_REQUEST_COPY,
  courierRequestChannels,
  shouldSendBookingNotice,
  type BookingNoticeEvent,
} from '@/lib/delivery/booking-notice';

type NoticeInput = {
  userId: string;
  bookingRequestId: string;
  event: BookingNoticeEvent;
  title: string;
  body: string;
  type: string;
  urgent?: boolean;
};

async function hasActivePushToken(
  prisma: PrismaClient,
  userId: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "PushToken"
    WHERE "userId" = ${userId} AND "isActive" = true
    LIMIT 1
  `.catch(() => []);
  return rows.length > 0;
}

async function noticeAlreadyStored(
  prisma: PrismaClient,
  userId: string,
  bookingRequestId: string,
  event: BookingNoticeEvent,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Notification"
    WHERE "userId" = ${userId}
      AND payload->'data'->>'bookingRequestId' = ${bookingRequestId}
      AND payload->'data'->>'noticeEvent' = ${event}
    LIMIT 1
  `.catch(() => []);
  return rows.length > 0;
}

async function sendBookingNotice(prisma: PrismaClient, input: NoticeInput): Promise<void> {
  if (!shouldSendBookingNotice(await noticeAlreadyStored(
    prisma,
    input.userId,
    input.bookingRequestId,
    input.event,
  ))) {
    return;
  }
  const link = bookingRequestDeepLink(input.bookingRequestId);
  const channels = courierRequestChannels({
    hasActivePushToken: await hasActivePushToken(prisma, input.userId),
    urgent: input.event === 'courier_requested',
  });
  await NotificationService.send({
    userId: input.userId,
    message: {
      title: input.title,
      body: input.body,
      urgent: input.urgent === true,
      data: {
        type: input.type,
        bookingRequestId: input.bookingRequestId,
        noticeEvent: input.event,
        link,
        actionUrl: link,
      },
    },
    channels,
    saveToDatabase: true,
    emailIdempotencyKey: bookingNoticeKey(input.bookingRequestId, input.event),
    emailPriority: input.event === 'courier_requested' ? EMAIL_PRIORITY.P0 : EMAIL_PRIORITY.P1,
  });
}

export async function notifyCourierOfNewBookingRequest(
  prisma: PrismaClient,
  input: { courierUserId: string; bookingRequestId: string },
): Promise<void> {
  try {
    await sendBookingNotice(prisma, {
      userId: input.courierUserId,
      bookingRequestId: input.bookingRequestId,
      event: 'courier_requested',
      title: COURIER_REQUEST_COPY.title,
      body: COURIER_REQUEST_COPY.body,
      type: 'DELIVERY_ORDER_AVAILABLE',
      urgent: true,
    });
  } catch (error) {
    console.warn('booking request notify failed', error);
  }
}

export async function notifyCourierBookingCancelled(
  prisma: PrismaClient,
  input: { courierUserId: string; bookingRequestId: string },
): Promise<void> {
  try {
    await sendBookingNotice(prisma, {
      userId: input.courierUserId,
      bookingRequestId: input.bookingRequestId,
      event: 'courier_cancelled',
      title: COURIER_CANCELLED_COPY.title,
      body: COURIER_CANCELLED_COPY.body,
      type: 'DELIVERY_CANCELLED',
      urgent: true,
    });
  } catch (error) {
    console.warn('booking cancel notify failed', error);
  }
}

export async function notifyBookingExpired(
  prisma: PrismaClient,
  input: { courierUserId: string; buyerUserId: string | null; bookingRequestId: string },
): Promise<void> {
  try {
    await sendBookingNotice(prisma, {
      userId: input.courierUserId,
      bookingRequestId: input.bookingRequestId,
      event: 'courier_expired',
      title: COURIER_EXPIRED_COPY.title,
      body: COURIER_EXPIRED_COPY.body,
      type: 'DELIVERY_CANCELLED',
      urgent: true,
    });
  } catch (error) {
    console.warn('booking expiry courier notify failed', error);
  }
  if (!input.buyerUserId) return;
  try {
    const { notifyReservationBuyer } = await import('@/lib/delivery/reservation-notifications');
    await notifyReservationBuyer(input.buyerUserId, 'expired', {
      bookingRequestId: input.bookingRequestId,
      prisma,
    });
  } catch (error) {
    console.warn('booking expiry buyer notify failed', error);
  }
}
