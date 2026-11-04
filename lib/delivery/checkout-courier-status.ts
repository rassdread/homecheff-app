/**
 * Buyer-facing courier checkout status.
 * The acceptance countdown reads the server expiresAt. It does not create
 * a deadline. Stock hold and payment window stay separate clocks.
 */

export const COURIER_STATUS_COPY = {
  nl: {
    waitingTitle: 'Wachten op bevestiging van de bezorger',
    waiting: 'Je bezorgverzoek is verstuurd. We wachten op bevestiging.',
    waitingHint: 'De bezorger heeft maximaal vijf minuten om het verzoek te accepteren.',
    accepted: 'Je bezorger heeft je bezorgverzoek geaccepteerd. Je kunt nu veilig betalen.',
    rejected: 'Deze bezorger kan je bestelling niet aannemen. Kies een andere bezorger.',
    expired: 'De bezorger heeft niet op tijd gereageerd. Kies een andere bezorger.',
    paymentExpired: 'Het betaalvenster is verlopen. Je kunt deze opdracht niet meer betalen.',
    stockExpired: 'De productreservering is verlopen. Controleer opnieuw of het product beschikbaar is.',
    noneAvailable: 'Er is momenteel geen geschikte bezorger beschikbaar. Probeer het later opnieuw.',
    switchCourier: 'Andere bezorger kiezen',
    responseLabel: 'Reactietijd',
    paymentLabel: 'Betaalvenster',
  },
  en: {
    waitingTitle: 'Waiting for the courier to confirm',
    waiting: 'Your delivery request has been sent. We are waiting for confirmation.',
    waitingHint: 'The courier has up to five minutes to accept the request.',
    accepted: 'Your courier accepted your delivery request. You can now pay safely.',
    rejected: 'This courier cannot take your order. Choose another courier.',
    expired: 'The courier did not respond in time. Choose another courier.',
    paymentExpired: 'The payment window has expired. You can no longer pay for this request.',
    stockExpired: 'The product reservation has expired. Check again whether the product is available.',
    noneAvailable: 'No suitable courier is available right now. Try again later.',
    switchCourier: 'Choose another courier',
    responseLabel: 'Response time',
    paymentLabel: 'Payment window',
  },
} as const;

export type CourierStatusLocale = keyof typeof COURIER_STATUS_COPY;

export function courierStatusCopy(locale: string | null | undefined) {
  return locale === 'en' ? COURIER_STATUS_COPY.en : COURIER_STATUS_COPY.nl;
}

/** mm:ss from a remaining duration. 299000 → 04:59. Never negative. */
export function formatCourierCountdown(remainingMs: number | null | undefined): string {
  const totalSeconds = Math.max(0, Math.floor((remainingMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Remaining time until the server deadline, corrected by the server clock
 * captured with that deadline. Does not invent a new expiresAt.
 */
export function courierAcceptanceRemainingMs(input: {
  expiresAt: string | null | undefined;
  serverNow: string | null | undefined;
  clientNow: number;
  clientNowAtServerSync: number | null;
}): number | null {
  if (!input.expiresAt) return null;
  const expires = Date.parse(input.expiresAt);
  if (!Number.isFinite(expires)) return null;
  let skew = 0;
  if (input.serverNow && input.clientNowAtServerSync != null) {
    const server = Date.parse(input.serverNow);
    if (Number.isFinite(server)) skew = server - input.clientNowAtServerSync;
  }
  return Math.max(0, expires - (input.clientNow + skew));
}

export type CourierCheckoutKind =
  | 'hidden'
  | 'waiting'
  | 'accepted'
  | 'rejected'
  | 'courier_expired'
  | 'payment_expired'
  | 'stock_expired';

export function courierCheckoutKind(input: {
  bookingStatus: string | null;
  reservationRemainingMs: number | null;
  paymentRemainingMs: number | null;
}): CourierCheckoutKind {
  const status = String(input.bookingStatus || '').toUpperCase();
  const payable =
    (status === 'ACCEPTED' || status === 'AUTO_CONFIRMED') &&
    input.paymentRemainingMs != null &&
    input.paymentRemainingMs > 0;
  if (payable) return 'accepted';
  if (status === 'EXPIRED') return 'courier_expired';
  if (status === 'ACCEPTED' || status === 'AUTO_CONFIRMED') return 'payment_expired';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'PENDING' && input.reservationRemainingMs === 0) return 'stock_expired';
  if (status === 'PENDING') return 'waiting';
  if (input.reservationRemainingMs === 0) return 'stock_expired';
  return 'hidden';
}

/** A switch may open the courier list only after the server says the old request is inactive. */
export function courierSwitchMayContinue(input: {
  httpOk: boolean;
  active: boolean | null | undefined;
  status: string | null | undefined;
}): boolean {
  if (!input.httpOk) return false;
  if (input.active !== false) return false;
  const status = String(input.status || '').toUpperCase();
  return status !== 'PENDING' && status !== 'ACCEPTED' && status !== 'AUTO_CONFIRMED' && status !== 'CONSUMED';
}
