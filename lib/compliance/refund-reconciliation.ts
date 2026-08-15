/**
 * LEGAL-4A — refund reconciliation states (deterministic).
 * Do not fabricate net consideration when evidence is incomplete.
 */

export const REFUND_RECONCILIATION_STATES = [
  'RECONCILED',
  'PARTIAL',
  'REVIEW_REQUIRED',
] as const;

export type RefundReconciliationState =
  (typeof REFUND_RECONCILIATION_STATES)[number];

export type MoneyEventForReconciliation = {
  amountCents: number;
  status: string;
  refundCentsLinked: number;
};

/**
 * Pure helper: compare transaction amount vs linked refund rows.
 */
export function reconcileRefundState(
  events: MoneyEventForReconciliation[],
): {
  state: RefundReconciliationState;
  grossCents: number;
  refundCents: number;
  netCents: number;
} {
  let grossCents = 0;
  let refundCents = 0;
  let review = false;

  for (const e of events) {
    const status = (e.status || '').toUpperCase();
    if (status === 'CAPTURED' || status === 'REFUNDED') {
      grossCents += Math.max(0, e.amountCents);
      refundCents += Math.max(0, e.refundCentsLinked);
      if (status === 'REFUNDED' && e.refundCentsLinked <= 0) {
        review = true;
      }
      if (e.refundCentsLinked > e.amountCents + 1) {
        review = true;
      }
    } else if (status === 'CANCELLED' || status === 'FAILED') {
      // not consideration
    } else if (status === 'CREATED' || status === 'AUTHORIZED') {
      review = true;
    }
  }

  const netCents = Math.max(0, grossCents - refundCents);
  if (review) {
    return { state: 'REVIEW_REQUIRED', grossCents, refundCents, netCents };
  }
  if (refundCents > 0 && refundCents < grossCents) {
    return { state: 'PARTIAL', grossCents, refundCents, netCents };
  }
  return { state: 'RECONCILED', grossCents, refundCents, netCents };
}
