export type PayoutCaseInput = {
  id: string;
  amountCents: number;
  toUserId: string;
  providerRef: string | null;
  transferFailureCode: string | null;
  transferFailureAt?: Date | null;
};

export function describeDeliveryPayout(payout: PayoutCaseInput) {
  const transferExists = Boolean(payout.providerRef?.startsWith('tr_'));
  const failureCategory =
    payout.transferFailureCode ||
    (payout.providerRef === 'failed_connect_missing' ? 'COURIER_CONNECT_REQUIRED' : null);
  const failed = Boolean(failureCategory) && !transferExists;
  return {
    payoutId: payout.id,
    deliveryOrderId: payout.id.startsWith('payout_delivery_')
      ? payout.id.slice('payout_delivery_'.length)
      : null,
    courierUserId: payout.toUserId,
    amountCents: payout.amountCents,
    currency: 'EUR',
    failureCategory,
    transferExists,
    retryEligible: failed,
    automaticRetry: false,
    ledgerState: transferExists ? 'TRANSFER_RECORDED' : failed ? 'EARNING_RECORDED_TRANSFER_MISSING' : 'UNKNOWN',
    transferFailureAt: payout.transferFailureAt ?? null,
  };
}

export function marketplaceDeliveryRefundPlan(input: {
  hasStandalonePaidSession: boolean;
  orderStripeSessionId?: string | null;
  quotedFeeCents?: number | null;
  orderTotalCents?: number | null;
}) {
  if (input.hasStandalonePaidSession) return { action: 'STANDALONE_DESK' as const };
  const fee = input.quotedFeeCents ?? 0;
  const total = input.orderTotalCents ?? 0;
  if (input.orderStripeSessionId && fee > 0 && total > fee) {
    return {
      action: 'MANUAL' as const,
      code: 'MARKETPLACE_PAYMENT_NOT_ISOLATED' as const,
    };
  }
  return { action: 'NOT_REFUNDABLE' as const, code: 'NOT_REFUNDABLE' as const };
}
