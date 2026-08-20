import {
  HC_SELLER_PAYOUT_IDEMPOTENCY_VERSION,
  type HcSellerPayoutEligibilityCode,
  type HcSellerPayoutEligibilityInput,
  type HcSellerPayoutEligibilityResult,
  HC_SELLER_PAYOUT_PAYABLE_STATUSES,
} from './types';

const COMPLETED_ORDER_STATUSES = new Set(['DELIVERED', 'COMPLETED']);
const FINAL_HC_PHASES = new Set(['HC_CAPTURED', 'SETTLEMENT_EARNED']);

export function hcSellerPayoutIdempotencyKey(exposureId: string): string {
  return `marketplace:hc:payout:${exposureId}:${HC_SELLER_PAYOUT_IDEMPOTENCY_VERSION}`;
}

export function resolvePayableAmountCents(exposure: {
  payableAmountCents: number | null;
  sellerNetExposureCents: number;
}): number {
  const raw = exposure.payableAmountCents ?? exposure.sellerNetExposureCents;
  return Math.floor(raw);
}

export function evaluateHcSellerPayoutEligibility(
  input: HcSellerPayoutEligibilityInput,
): HcSellerPayoutEligibilityResult {
  const { exposure, order, seller } = input;
  const payableAmountCents = resolvePayableAmountCents(exposure);
  const idempotencyKey = hcSellerPayoutIdempotencyKey(exposure.id);

  const ineligible = (
    code: HcSellerPayoutEligibilityCode,
    destinationAccountId: string | null = null,
  ): HcSellerPayoutEligibilityResult => ({
    eligible: false,
    code,
    payableAmountCents,
    destinationAccountId,
    idempotencyKey,
  });

  if (!input.engineEnabled) return ineligible('PAYOUT_ENGINE_DISABLED');
  if (input.isProductionDatabase && !input.productionMutationEnabled) {
    return ineligible('PAYOUT_PRODUCTION_MUTATION_DISABLED');
  }

  if (exposure.status === 'PAID' || exposure.paidAt || exposure.payoutReference) {
    return ineligible('EXPOSURE_ALREADY_PAID', seller.stripeConnectAccountId);
  }

  if (exposure.status === 'PAYOUT_PENDING') {
    return ineligible('PAYOUT_IN_PROGRESS', seller.stripeConnectAccountId);
  }

  if (exposure.status === 'REVERSED' || exposure.status === 'VOID') {
    return ineligible('ORDER_REFUNDED_OR_REVERSED');
  }

  if (exposure.status === 'PAYOUT_BLOCKED') {
    return ineligible('EXPOSURE_STATUS_NOT_PAYABLE');
  }

  if (!HC_SELLER_PAYOUT_PAYABLE_STATUSES.includes(exposure.status)) {
    return ineligible('EXPOSURE_STATUS_NOT_PAYABLE');
  }

  if (order.paymentMethod !== 'HC_ONLY') return ineligible('ORDER_NOT_HC_ONLY');
  if (!COMPLETED_ORDER_STATUSES.has(order.status)) return ineligible('ORDER_NOT_COMPLETED');
  if (!order.hcPaymentPhase || !FINAL_HC_PHASES.has(order.hcPaymentPhase)) {
    return ineligible('HC_CAPTURE_NOT_FINAL');
  }

  if (exposure.settlementSource !== 'HOMECHEFF_TREASURY') {
    return ineligible('SETTLEMENT_SOURCE_UNSUPPORTED');
  }

  if (payableAmountCents <= 0) return ineligible('PAYABLE_AMOUNT_INVALID');

  if (input.expectedSellerUserId && input.expectedSellerUserId !== exposure.sellerUserId) {
    return ineligible('SELLER_MISMATCH');
  }

  if (input.expectedAmountCents != null && input.expectedAmountCents !== payableAmountCents) {
    return ineligible('PAYABLE_AMOUNT_INVALID');
  }

  if (order.sellerUserId && order.sellerUserId !== exposure.sellerUserId) {
    return ineligible('SELLER_MISMATCH');
  }

  const destination = seller.stripeConnectAccountId?.trim() || null;
  const destinationReady = Boolean(destination && seller.stripeConnectOnboardingCompleted);
  if (!destinationReady) return ineligible('PAYOUT_DESTINATION_NOT_READY');

  return {
    eligible: true,
    code: 'ELIGIBLE',
    payableAmountCents,
    destinationAccountId: destination,
    idempotencyKey,
  };
}

/** Refund-after-payout is policy-gated — no automatic clawback. */
export function evaluateRefundAfterPayoutPolicy(exposureStatus: string): HcSellerPayoutEligibilityCode | null {
  if (exposureStatus === 'PAID') return 'REFUND_AFTER_PAYOUT_POLICY_REQUIRED';
  return null;
}
