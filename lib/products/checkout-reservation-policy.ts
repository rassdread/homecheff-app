/**
 * Checkout reservation deadlines.
 * The hard hold is set once. Courier switches, retries, and a new
 * Checkout Session must not move holdUntil later.
 *
 * Scheduled booking constants are prepared only. scheduledBookingExposed()
 * stays false until vehicle-specific availability exists.
 */

export const IMMEDIATE_COURIER_RESPONSE_MS = 5 * 60 * 1000;
export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
export const IMMEDIATE_HARD_HOLD_MS =
  IMMEDIATE_COURIER_RESPONSE_MS + PAYMENT_WINDOW_MS;

/** Future scheduled courier response. Not applied in this release. */
export const SCHEDULED_COURIER_RESPONSE_DEFAULT_MS = 2 * 60 * 60 * 1000;
export const SCHEDULED_COURIER_RESPONSE_MAX_MS = 12 * 60 * 60 * 1000;

export const RESERVATION_PHASE = {
  AWAITING_COURIER: 'AWAITING_COURIER',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  CHECKOUT: 'CHECKOUT',
} as const;

export type ReservationPhase =
  (typeof RESERVATION_PHASE)[keyof typeof RESERVATION_PHASE];

export type SellerStockLabel = 'AVAILABLE' | 'TEMPORARILY_RESERVED' | 'SOLD';

export const RESERVATION_COPY = {
  nl: {
    reserved: 'Product tijdelijk gereserveerd.',
    accepted: 'Bezorger heeft bevestigd. Rond je betaling af.',
    rejected: 'Deze bezorger is niet beschikbaar. Kies een andere bezorgoptie.',
    expired:
      'De reservering is verlopen. Controleer opnieuw of het product beschikbaar is.',
  },
  en: {
    reserved: 'Product temporarily reserved.',
    accepted: 'Courier confirmed. Complete your payment.',
    rejected: 'This courier is not available. Choose another delivery option.',
    expired:
      'The reservation has expired. Check again whether the product is available.',
  },
} as const;

export function scheduledBookingExposed(): boolean {
  return false;
}

export function immediateHardHoldUntil(now: Date): Date {
  return new Date(now.getTime() + IMMEDIATE_HARD_HOLD_MS);
}

/** Courier response deadline inside the original hard hold. Never past holdUntil. */
export function courierResponseDeadline(now: Date, holdUntil: Date): Date {
  const proposed = now.getTime() + IMMEDIATE_COURIER_RESPONSE_MS;
  return new Date(Math.min(proposed, holdUntil.getTime()));
}

/**
 * Payment deadline after the courier accepts.
 * min(now + 30 minutes, original holdUntil). Never extends the hard hold.
 */
export function paymentDeadlineAfterAccept(now: Date, holdUntil: Date): Date {
  const proposed = now.getTime() + PAYMENT_WINDOW_MS;
  return new Date(Math.min(proposed, holdUntil.getTime()));
}

export function courierProductHoldApplies(input: {
  usesPhysicalInventory: boolean;
  deliveryMode?: string | null;
}): boolean {
  if (!input.usesPhysicalInventory) return false;
  const mode = (input.deliveryMode || '').toUpperCase();
  if (
    mode === 'SHIPPING' ||
    mode === 'PARCEL_SHIPPING' ||
    mode === 'PICKUP'
  ) {
    return false;
  }
  return true;
}

export function sellerStockLabel(
  stock: number,
  reservedQuantity: number,
): SellerStockLabel {
  if (stock <= 0) return 'SOLD';
  if (reservedQuantity > 0) return 'TEMPORARILY_RESERVED';
  return 'AVAILABLE';
}

export type StockConfirmCode =
  | 'HOLD_EXPIRED'
  | 'HOLD_MISSING'
  | 'HELD_BY_OTHER'
  | 'NOT_OWNED'
  | 'QTY_MISMATCH'
  | 'PAYMENT_DEADLINE'
  | 'ALREADY_CONFIRMED';

export function evaluateStockConfirm(input: {
  inventoryRequired: boolean;
  now: Date;
  reservation: {
    status: string;
    quantity: number;
    expiresAt: Date;
    holdUntil?: Date | null;
    paymentDeadline?: Date | null;
    buyerId?: string | null;
    checkoutSessionId?: string | null;
  } | null;
  requestedQuantity: number;
  buyerId?: string | null;
  payingSessionId?: string | null;
  stock: number;
  otherPendingQuantity: number;
}):
  | { action: 'skip' }
  | { action: 'noop' }
  | { action: 'confirm'; quantity: number }
  | { action: 'conflict'; code: StockConfirmCode } {
  if (!input.inventoryRequired) return { action: 'skip' };
  const reservation = input.reservation;
  if (!reservation) return { action: 'conflict', code: 'HOLD_MISSING' };
  if (
    reservation.buyerId &&
    input.buyerId &&
    reservation.buyerId !== input.buyerId
  ) {
    return { action: 'conflict', code: 'NOT_OWNED' };
  }
  if (reservation.status === 'CONFIRMED') {
    if (
      input.payingSessionId &&
      reservation.checkoutSessionId &&
      reservation.checkoutSessionId === input.payingSessionId
    ) {
      return { action: 'noop' };
    }
    return { action: 'conflict', code: 'ALREADY_CONFIRMED' };
  }
  if (reservation.status !== 'PENDING') {
    return { action: 'conflict', code: 'HOLD_EXPIRED' };
  }
  if (reservation.expiresAt.getTime() <= input.now.getTime()) {
    return { action: 'conflict', code: 'HOLD_EXPIRED' };
  }
  if (
    reservation.holdUntil &&
    reservation.holdUntil.getTime() <= input.now.getTime()
  ) {
    return { action: 'conflict', code: 'HOLD_EXPIRED' };
  }
  if (
    reservation.paymentDeadline &&
    reservation.paymentDeadline.getTime() <= input.now.getTime()
  ) {
    return { action: 'conflict', code: 'PAYMENT_DEADLINE' };
  }
  if (input.requestedQuantity !== reservation.quantity) {
    return { action: 'conflict', code: 'QTY_MISMATCH' };
  }
  const unreservedForOthers = input.stock - input.otherPendingQuantity;
  if (input.requestedQuantity > unreservedForOthers) {
    return { action: 'conflict', code: 'HELD_BY_OTHER' };
  }
  return { action: 'confirm', quantity: reservation.quantity };
}

export class CheckoutStockConflictError extends Error {
  code: StockConfirmCode;

  constructor(code: StockConfirmCode, message?: string) {
    super(message || code);
    this.name = 'CheckoutStockConflictError';
    this.code = code;
  }
}

/** Stripe Checkout expires_at cannot be shorter than 30 minutes. The app deadline is enforced separately. */
export const STRIPE_CHECKOUT_MIN_EXPIRES_SECONDS = 30 * 60;

export type StripeExpireMode = 'unconfigured' | 'test' | 'live';

export function stripeExpireMode(secret: string | null | undefined): StripeExpireMode {
  if (!secret) return 'unconfigured';
  if (secret.startsWith('sk_live')) return 'live';
  if (secret.startsWith('sk_test_')) return 'test';
  return 'unconfigured';
}

/**
 * A live key may expire sessions on the production runtime.
 * A local shell that merely has a live key loaded must not call Stripe.
 */
/** Accepts process.env and small test objects without treating every key as required. */
export type CheckoutStripeEnv = {
  VERCEL_ENV?: string;
  CHECKOUT_ALLOW_LIVE_STRIPE_EXPIRE?: string;
  [key: string]: string | undefined;
};

export function liveStripeMutationAllowed(env: CheckoutStripeEnv = process.env): boolean {
  if (env.VERCEL_ENV === 'production') return true;
  return env.CHECKOUT_ALLOW_LIVE_STRIPE_EXPIRE === '1';
}

export function stripeSecretAllowsSessionExpire(
  secret: string | null | undefined,
  env: CheckoutStripeEnv = {},
): boolean {
  const mode = stripeExpireMode(secret);
  if (mode === 'test') return true;
  if (mode === 'live') return liveStripeMutationAllowed(env);
  return false;
}

export type SessionExpirePlan =
  | 'EXPIRE'
  | 'SKIP_PAID'
  | 'SKIP_COMPLETE'
  | 'SKIP_ALREADY_EXPIRED'
  | 'SKIP_NOT_OPEN';

/** Decide from a retrieved Checkout Session. Paid and completed sessions are never expired. */
export function planCheckoutSessionExpiration(session: {
  status?: string | null;
  payment_status?: string | null;
}): SessionExpirePlan {
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
    return 'SKIP_PAID';
  }
  if (session.status === 'complete') return 'SKIP_COMPLETE';
  if (session.status === 'expired') return 'SKIP_ALREADY_EXPIRED';
  if (session.status === 'open') return 'EXPIRE';
  return 'SKIP_NOT_OPEN';
}

export type IncidentResolution = {
  status: 'RESOLVED_ORDER_EXISTS' | 'REFUND_RECORDED' | 'MANUAL_REVIEW';
  resolution: 'ORDER_EXISTS' | 'REFUND_ALREADY_EXISTS' | 'AUTO_REFUND_BLOCKED';
  refund: false;
  refundId?: string;
  orderId?: string;
};

/**
 * Automated refunds are blocked. A valid order or an existing refund is recorded.
 * Anything else waits for a person. This function never requests a refund.
 */
export function decideIncidentResolution(input: {
  orderId: string | null;
  existingRefundId: string | null;
}): IncidentResolution {
  if (input.orderId) {
    return {
      status: 'RESOLVED_ORDER_EXISTS',
      resolution: 'ORDER_EXISTS',
      refund: false,
      orderId: input.orderId,
    };
  }
  if (input.existingRefundId) {
    return {
      status: 'REFUND_RECORDED',
      resolution: 'REFUND_ALREADY_EXISTS',
      refund: false,
      refundId: input.existingRefundId,
    };
  }
  return {
    status: 'MANUAL_REVIEW',
    resolution: 'AUTO_REFUND_BLOCKED',
    refund: false,
  };
}
