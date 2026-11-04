/**
 * Decisions for courier booking notices.
 * A registered push token means HomeCheff can offer the notice to FCM.
 * It does not prove the device received it or that the courier read it.
 * Email is sent immediately only when no active token exists, so a working
 * push registration is not paired with a second identical email.
 */

export type BookingNoticeEvent =
  | 'courier_requested'
  | 'courier_cancelled'
  | 'courier_expired'
  | 'buyer_accepted'
  | 'buyer_rejected'
  | 'buyer_expired';

const BOOKING_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function sanitizeBookingRequestId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return BOOKING_ID.test(trimmed) ? trimmed : null;
}

export function bookingRequestDeepLink(bookingRequestId: string): string {
  return `/delivery/dashboard?bookingRequestId=${encodeURIComponent(bookingRequestId)}`;
}

export function courierRequestChannels(
  hasActivePushToken: boolean,
): Array<'push' | 'email'> {
  return hasActivePushToken ? ['push'] : ['push', 'email'];
}

export function bookingNoticeKey(
  bookingRequestId: string,
  event: BookingNoticeEvent,
): string {
  return `booking:${bookingRequestId}:${event}`;
}

export function shouldSendBookingNotice(alreadyStored: boolean): boolean {
  return !alreadyStored;
}

export function bookingAcceptAllowed(input: {
  status: string;
  expiresAt: string | Date | null;
  now: Date;
}): boolean {
  if (input.status !== 'PENDING') return false;
  if (!input.expiresAt) return false;
  const expires =
    input.expiresAt instanceof Date
      ? input.expiresAt.getTime()
      : Date.parse(input.expiresAt);
  return Number.isFinite(expires) && expires > input.now.getTime();
}

export function viewerMayReadBooking(input: {
  viewerUserId: string;
  buyerId: string;
  courierUserId: string;
}): boolean {
  return (
    input.viewerUserId === input.buyerId ||
    input.viewerUserId === input.courierUserId
  );
}

export const COURIER_REQUEST_COPY = {
  title: 'Nieuwe HomeCheff-bezorgaanvraag — reageer binnen 5 minuten',
  body: 'Er staat een nieuwe bezorgaanvraag voor je klaar. Reageer binnen 5 minuten in HomeCheff. Beschikbaarheid kan veranderen. Accepteren kan alleen nadat je bent ingelogd.',
};

export const COURIER_CANCELLED_COPY = {
  title: 'Bezorgaanvraag geannuleerd',
  body: 'De koper heeft een andere bezorger gekozen. Deze aanvraag is niet meer actief en kan niet meer worden geaccepteerd.',
};

export const COURIER_EXPIRED_COPY = {
  title: 'Bezorgaanvraag verlopen',
  body: 'De reactietijd van 5 minuten is voorbij. Deze aanvraag is niet meer beschikbaar.',
};

export const PAID_COURIER_ORDER_TITLE =
  'Bezorgopdracht bevestigd — betaling ontvangen';

export const OPEN_COURIER_ORDER_TITLE = '🔔 Nieuwe bezorgopdracht beschikbaar!';

export const PAYMENT_FAILED_COPY = {
  title: 'Betaling niet gelukt',
  body: 'Je betaling is niet bevestigd. Er is geen bestelling geplaatst. Je kunt het opnieuw proberen in de checkout.',
};

export const BOOKING_UNAVAILABLE_COPY =
  'Deze aanvraag is niet meer beschikbaar.';

export function paymentFailureTarget(
  metadata: { buyerId?: string | null } | null | undefined,
  eventId: string | null | undefined,
): { buyerId: string; eventId: string } | null {
  const buyerId = metadata?.buyerId?.trim() ?? '';
  const id = eventId?.trim() ?? '';
  if (!buyerId || !id) return null;
  return { buyerId, eventId: id };
}

export function paidCourierOrderCopy(confirmed: boolean, orderNumber: string): {
  title: string;
  body: string;
} {
  if (confirmed) {
    return {
      title: PAID_COURIER_ORDER_TITLE,
      body: `De betaling voor bezorgopdracht #${orderNumber} is ontvangen. De opdracht is bevestigd.`,
    };
  }
  return {
    title: OPEN_COURIER_ORDER_TITLE,
    body: '',
  };
}
