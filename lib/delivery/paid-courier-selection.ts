/**
 * Codes that describe one courier's payout or agreement state.
 * The customer list omits that courier. The words stay off the customer screen.
 */
const PRIVATE_COURIER_STATUS_CODES = new Set([
  'COURIER_CONNECT_REQUIRED',
  'COURIER_CONNECT_INCOMPLETE',
  'COURIER_CONNECT_STALE',
  'COURIER_CONNECT_UNVERIFIED',
  'COURIER_PAYOUT_NOT_READY',
  'AGREEMENT_ACCEPTANCE_REQUIRED',
  'DELIVERY_PROVIDER_INELIGIBLE',
]);

export const NO_PAID_COURIER_MESSAGE = 'Geen bezorgers beschikbaar voor deze opdracht';

/** A shown courier can no longer take the paid job. Drop the choice and the price. */
export function shownCourierLeftPaidList(code: unknown): boolean {
  return typeof code === 'string' && PRIVATE_COURIER_STATUS_CODES.has(code);
}
