import { NotificationService } from '@/lib/notifications/notification-service';
import { RESERVATION_COPY } from '@/lib/products/checkout-reservation-policy';

/** Buyer notices for the courier hold. Failure must not change the reservation. */
export async function notifyReservationBuyer(
  userId: string | null | undefined,
  kind: 'accepted' | 'rejected' | 'expired',
) {
  if (!userId) return;
  const copy = RESERVATION_COPY.nl;
  const body =
    kind === 'accepted' ? copy.accepted : kind === 'rejected' ? copy.rejected : copy.expired;
  try {
    await NotificationService.send({
      userId,
      message: {
        title: body,
        body,
        data: {
          type: 'CHECKOUT_RESERVATION',
          kind,
          titleEn:
            kind === 'accepted'
              ? RESERVATION_COPY.en.accepted
              : kind === 'rejected'
                ? RESERVATION_COPY.en.rejected
                : RESERVATION_COPY.en.expired,
        },
      },
      channels: ['push'],
      saveToDatabase: true,
    });
  } catch (error) {
    console.warn('[reservation] notification failed', kind, error);
  }
}
