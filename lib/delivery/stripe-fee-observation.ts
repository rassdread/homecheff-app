/**
 * Stripe processing cost from a balance transaction.
 * The buyer surcharge is an estimate collected at checkout. It is not the fee.
 * A pending fee is not settled profit.
 */

export type StripeFeeSource = 'stripe_balance_transaction' | 'unavailable';

export type StripeFeeObservation = {
  feeCents: number | null;
  feeStatus: 'unavailable' | 'pending' | 'available';
  feeSource: StripeFeeSource;
  stripeFeeFinal: boolean;
};

export function observeStripeProcessingFee(
  balanceTransaction: { fee?: number | null; status?: string | null } | null | undefined,
): StripeFeeObservation {
  const fee = balanceTransaction?.fee;
  const status = balanceTransaction?.status;
  if (typeof fee !== 'number' || !Number.isInteger(fee) || fee < 0) {
    return { feeCents: null, feeStatus: 'unavailable', feeSource: 'unavailable', stripeFeeFinal: false };
  }
  if (status !== 'pending' && status !== 'available') {
    return { feeCents: null, feeStatus: 'unavailable', feeSource: 'unavailable', stripeFeeFinal: false };
  }
  return {
    feeCents: fee,
    feeStatus: status,
    feeSource: 'stripe_balance_transaction',
    stripeFeeFinal: status === 'available',
  };
}
