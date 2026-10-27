export const DUPLICATE_REFUND_CODES = new Set([
  'ALREADY_CONFIRMED',
  'HOLD_EXPIRED',
  'HOLD_MISSING',
  'PAYMENT_DEADLINE',
  'HELD_BY_OTHER',
  'QTY_MISMATCH',
  'NOT_OWNED',
]);

export function duplicateRefundIdempotencyKey(chargeId: string): string {
  return `hc_duplicate_refund_${chargeId}`;
}

export type DuplicateRefundDecision =
  | { action: 'refund'; idempotencyKey: string; amountCents: number; currency: 'eur' }
  | { action: 'already_recorded'; refundId: string; pending: boolean }
  | { action: 'manual'; reason: string };

/**
 * Decide whether an extra captured charge may be refunded.
 * A charge that belongs to a fulfilled order, a settlement, or a dispute is not refunded here.
 */
export function evaluateDuplicateRefund(input: {
  incidentCode: string;
  orderIdForSession: string | null;
  settlementExists: boolean;
  paymentIntentId: string | null;
  chargeId: string | null;
  amountCents: number | null;
  currency: string | null;
  expectedAmountCents: number | null;
  disputed: boolean;
  existingRefundId: string | null;
  existingRefundStatus: string | null;
  refundsAllowed: boolean;
}): DuplicateRefundDecision {
  if (input.orderIdForSession) return { action: 'manual', reason: 'ORDER_EXISTS' };
  if (!DUPLICATE_REFUND_CODES.has(input.incidentCode)) {
    return { action: 'manual', reason: 'NOT_A_DUPLICATE_PAYMENT' };
  }
  if (!input.refundsAllowed) return { action: 'manual', reason: 'REFUND_NOT_AUTHORIZED' };
  if (input.settlementExists) return { action: 'manual', reason: 'PREVIOUSLY_SETTLED' };
  if (input.disputed) return { action: 'manual', reason: 'DISPUTED' };
  if (!input.paymentIntentId) return { action: 'manual', reason: 'MISSING_PAYMENT_INTENT' };
  if (!input.chargeId) return { action: 'manual', reason: 'MISSING_CHARGE' };
  if ((input.currency || '').toLowerCase() !== 'eur') {
    return { action: 'manual', reason: 'CURRENCY' };
  }
  if (
    input.expectedAmountCents != null &&
    input.amountCents != null &&
    input.amountCents !== input.expectedAmountCents
  ) {
    return { action: 'manual', reason: 'AMOUNT' };
  }
  if (!input.amountCents || input.amountCents <= 0) {
    return { action: 'manual', reason: 'AMOUNT' };
  }
  if (input.existingRefundId) {
    const status = (input.existingRefundStatus || '').toLowerCase();
    if (status === 'failed' || status === 'canceled') {
      return { action: 'manual', reason: 'REFUND_FAILED' };
    }
    return {
      action: 'already_recorded',
      refundId: input.existingRefundId,
      pending: status !== 'succeeded',
    };
  }
  return {
    action: 'refund',
    idempotencyKey: duplicateRefundIdempotencyKey(input.chargeId),
    amountCents: input.amountCents,
    currency: 'eur',
  };
}
