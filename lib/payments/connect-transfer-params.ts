/**
 * Stripe Separate Charges & Transfers param builder.
 *
 * Stripe rejects transfers that pass `transfer_group` when `source_transaction`
 * already carries a transfer_group (including after an earlier transfer stamped
 * the Charge). When funding from a Charge, only set transfer_group if the Charge
 * does not already have one.
 */
import type Stripe from 'stripe';

export function buildSeparateChargesTransferParams(input: {
  amount: number;
  currency: string;
  destination: string;
  orderId: string;
  sourceTransactionChargeId?: string | null;
  /** Existing Charge.transfer_group, if known */
  chargeTransferGroup?: string | null;
  metadata: Stripe.MetadataParam;
}): Stripe.TransferCreateParams {
  const params: Stripe.TransferCreateParams = {
    amount: input.amount,
    currency: input.currency,
    destination: input.destination,
    metadata: input.metadata,
  };

  const orderGroup = `order_${input.orderId}`;

  if (input.sourceTransactionChargeId) {
    params.source_transaction = input.sourceTransactionChargeId;
    // Charge already grouped → inherit; do not pass transfer_group again.
    if (!input.chargeTransferGroup) {
      params.transfer_group = orderGroup;
    }
  } else {
    params.transfer_group = orderGroup;
  }

  return params;
}

export function isTransferGroupSourceConflict(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('transfer_group') && m.includes('source_transaction');
}

export function isInsufficientAvailableBalanceError(message: string): boolean {
  return /insufficient/i.test(message);
}
