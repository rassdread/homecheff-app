/**
 * Courier-facing display for booking vs verified payment.
 * Reuses DB statuses: ACCEPTED/AUTO_CONFIRMED = awaiting payment,
 * CONSUMED (+ deliveryOrderId) = payment confirmed. No new enums.
 */

export type CourierPaymentDisplayKind =
  | 'REQUESTED'
  | 'ACCEPTED_AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_EXPIRED'
  | 'CANCELLED'
  | 'FAILED'
  | 'OTHER';

export function courierPaymentDisplayKind(input: {
  bookingStatus: string;
  calendarStatus?: string | null;
  deliveryOrderId?: string | null;
  paymentDeadline?: Date | string | null;
  now?: Date;
}): CourierPaymentDisplayKind {
  const status = String(input.bookingStatus || '').toUpperCase();
  const now = input.now ?? new Date();
  const deadline = input.paymentDeadline ? new Date(input.paymentDeadline) : null;
  const deadlinePassed = deadline != null && !Number.isNaN(deadline.getTime()) && deadline.getTime() <= now.getTime();

  if (status === 'PENDING') return 'REQUESTED';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'CANCELLED';
  if (status === 'EXPIRED' || deadlinePassed) {
    if (status === 'ACCEPTED' || status === 'AUTO_CONFIRMED' || status === 'EXPIRED') {
      return 'PAYMENT_EXPIRED';
    }
  }
  if (status === 'CONSUMED' || Boolean(input.deliveryOrderId)) return 'PAYMENT_CONFIRMED';
  if (status === 'ACCEPTED' || status === 'AUTO_CONFIRMED') return 'ACCEPTED_AWAITING_PAYMENT';

  // Calendar CONFIRMED without an order is still unpaid reservation.
  if (
    String(input.calendarStatus || '').toUpperCase() === 'CONFIRMED' &&
    !input.deliveryOrderId
  ) {
    return 'ACCEPTED_AWAITING_PAYMENT';
  }

  return 'OTHER';
}

/** API/UI status token for courier dashboard cards. */
export function courierDashboardStatusToken(kind: CourierPaymentDisplayKind): string {
  switch (kind) {
    case 'REQUESTED':
      return 'PENDING';
    case 'ACCEPTED_AWAITING_PAYMENT':
      return 'AWAITING_PAYMENT';
    case 'PAYMENT_CONFIRMED':
      return 'PAYMENT_CONFIRMED';
    case 'PAYMENT_EXPIRED':
      return 'PAYMENT_EXPIRED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

export function courierPaymentStatusCopyNl(kind: CourierPaymentDisplayKind): {
  label: string;
  body: string;
} {
  switch (kind) {
    case 'REQUESTED':
      return {
        label: 'Nieuw bezorgverzoek',
        body: 'Een koper wil jou als bezorger. Accepteer of wijs af.',
      };
    case 'ACCEPTED_AWAITING_PAYMENT':
      return {
        label: 'Wachten op betaling',
        body: 'Bezorgverzoek geaccepteerd. Wachten op betaling door de koper.',
      };
    case 'PAYMENT_CONFIRMED':
      return {
        label: 'Betaling ontvangen',
        body: 'Betaling ontvangen. Je bezorgopdracht is definitief bevestigd.',
      };
    case 'PAYMENT_EXPIRED':
      return {
        label: 'Betaling verlopen',
        body: 'De koper heeft niet op tijd betaald. Deze reservering is vrijgegeven.',
      };
    case 'CANCELLED':
      return {
        label: 'Geannuleerd',
        body: 'Deze bezorgreservering is geannuleerd.',
      };
    case 'FAILED':
      return {
        label: 'Betaling mislukt',
        body: 'De betaling is mislukt. Deze reservering is niet actief.',
      };
    default:
      return {
        label: 'Status onbekend',
        body: 'Status wordt bijgewerkt.',
      };
  }
}

/** Unpaid calendar rows must not look financially confirmed. */
export function remapCalendarJobForCourierDisplay(input: {
  status: string;
  bookingRequestId?: string | null;
  deliveryOrderId?: string | null;
  paymentDeadline?: Date | string | null;
  bookingStatus?: string | null;
  now?: Date;
}): { status: string; kind: CourierPaymentDisplayKind } {
  if (input.deliveryOrderId) {
    return { status: 'PAYMENT_CONFIRMED', kind: 'PAYMENT_CONFIRMED' };
  }
  if (input.bookingRequestId) {
    const kind = courierPaymentDisplayKind({
      bookingStatus: input.bookingStatus || 'ACCEPTED',
      calendarStatus: input.status,
      deliveryOrderId: input.deliveryOrderId,
      paymentDeadline: input.paymentDeadline,
      now: input.now,
    });
    return { status: courierDashboardStatusToken(kind), kind };
  }
  return {
    status: input.status,
    kind: courierPaymentDisplayKind({
      bookingStatus: input.status,
      calendarStatus: input.status,
      deliveryOrderId: input.deliveryOrderId,
      paymentDeadline: input.paymentDeadline,
      now: input.now,
    }),
  };
}

/** Pickup/complete only after verified payment linkage. */
export function courierMayExecuteDelivery(input: {
  deliveryOrderId?: string | null;
  bookingStatus?: string | null;
}): boolean {
  if (input.deliveryOrderId) return true;
  return String(input.bookingStatus || '').toUpperCase() === 'CONSUMED';
}
