/**
 * A failed seller transfer stays on its original Stripe idempotency key.
 * Retrying that key replays the cached failure. A new key is used only after
 * a live transfer list shows no matching transfer, and only from an explicit
 * admin recovery. Automatic webhook retries adopt an existing transfer or wait.
 */

export function sellerTransferRecoveryIdempotencyKey(
  orderId: string,
  productId: string,
  chargeId: string,
  generation: number,
): string {
  return `hc_seller_xfer_${orderId}_${productId}_stx_${chargeId}_recover_${generation}`;
}

export type ListedSellerTransfer = {
  id: string;
  amount: number;
  destination: string | null;
  sourceTransaction: string | null;
  orderId: string | null;
  productId: string | null;
};

export type SellerTransferLookup =
  | { ok: false; reason: 'LOOKUP_FAILED' }
  | { ok: true; match: 'none' }
  | { ok: true; match: 'one'; transferId: string }
  | { ok: true; match: 'ambiguous' };

export function classifySellerTransferList(input: {
  transfers: ListedSellerTransfer[];
  orderId: string;
  productId: string;
  amountCents: number;
  chargeId: string | null;
  destination: string | null;
}): SellerTransferLookup {
  const exact = input.transfers.filter(
    (transfer) =>
      transfer.orderId === input.orderId && transfer.productId === input.productId,
  );
  if (exact.length > 1) return { ok: true, match: 'ambiguous' };
  if (exact.length === 1) {
    const transfer = exact[0];
    if (transfer.amount !== input.amountCents) return { ok: true, match: 'ambiguous' };
    if (
      input.chargeId &&
      transfer.sourceTransaction &&
      transfer.sourceTransaction !== input.chargeId
    ) {
      return { ok: true, match: 'ambiguous' };
    }
    return { ok: true, match: 'one', transferId: transfer.id };
  }

  const loose = input.transfers.filter((transfer) => {
    if (transfer.amount !== input.amountCents) return false;
    if (input.destination && transfer.destination && transfer.destination !== input.destination) {
      return false;
    }
    if (
      input.chargeId &&
      transfer.sourceTransaction &&
      transfer.sourceTransaction !== input.chargeId
    ) {
      return false;
    }
    return true;
  });
  if (loose.length > 1) return { ok: true, match: 'ambiguous' };
  if (loose.length === 1) return { ok: true, match: 'one', transferId: loose[0].id };
  return { ok: true, match: 'none' };
}

export type SellerTransferRecoveryDecision =
  | { action: 'already_settled'; transferId: string }
  | { action: 'adopt'; transferId: string }
  | { action: 'wait'; reason: string }
  | { action: 'manual'; reason: string }
  | { action: 'create'; generation: number; idempotencyKey: string };

/** True only after transfers.create was called. Local pre-checks do not cache a Stripe key. */
export function stripeTransferWasAttempted(providerRef: string | null | undefined): boolean {
  if (!providerRef?.startsWith('failed_')) return false;
  if (providerRef.startsWith('failed_connect_not_ready_')) return false;
  if (providerRef.startsWith('failed_missing_source_')) return false;
  if (providerRef.startsWith('failed_platform_fallback_blocked_')) return false;
  if (providerRef.startsWith('failed_charge_not_payable_')) return false;
  return true;
}

export function parseRecoveryGeneration(code: string | null | undefined): number | null {
  const match = /^RECOVERY_G(\d+)(?:_FAILED)?$/.exec(code || '');
  if (!match) return null;
  const generation = Number(match[1]);
  return Number.isInteger(generation) && generation > 0 ? generation : null;
}

export function decideSellerTransferRecovery(input: {
  lookup: SellerTransferLookup;
  localTransferId: string | null;
  orderStatus: string;
  chargeRefunded: boolean;
  chargeDisputed: boolean;
  partialRefund: boolean;
  destination: string | null;
  destinationReady: boolean;
  platformAccountId: string | null;
  amountCents: number;
  expectedAmountCents: number;
  failedAttemptRecorded: boolean;
  recoveryCode: string | null;
  explicitAdminRecovery: boolean;
  confirmNewGeneration: boolean;
  orderId: string;
  productId: string;
  chargeId: string | null;
}): SellerTransferRecoveryDecision {
  if (input.localTransferId?.startsWith('tr_')) {
    return { action: 'already_settled', transferId: input.localTransferId };
  }
  if (!input.lookup.ok) return { action: 'manual', reason: input.lookup.reason };
  if (input.lookup.match === 'ambiguous') {
    return { action: 'manual', reason: 'AMBIGUOUS_TRANSFERS' };
  }
  if (input.lookup.match === 'one') {
    return { action: 'adopt', transferId: input.lookup.transferId };
  }
  if (input.chargeRefunded || input.partialRefund) {
    return { action: 'manual', reason: 'CHARGE_REFUNDED' };
  }
  if (input.chargeDisputed) return { action: 'manual', reason: 'DISPUTED' };
  if (input.orderStatus === 'REFUNDED' || input.orderStatus === 'CANCELLED') {
    return { action: 'manual', reason: 'ORDER_CLOSED' };
  }
  if (!input.destination || !input.destinationReady) {
    return { action: 'manual', reason: 'CONNECT_NOT_READY' };
  }
  if (input.platformAccountId && input.destination === input.platformAccountId) {
    return { action: 'manual', reason: 'PLATFORM_DESTINATION' };
  }
  if (!input.destination.startsWith('acct_')) {
    return { action: 'manual', reason: 'DESTINATION_INVALID' };
  }
  if (input.amountCents !== input.expectedAmountCents || input.amountCents <= 0) {
    return { action: 'manual', reason: 'AMOUNT' };
  }
  if (!input.chargeId) return { action: 'manual', reason: 'MISSING_CHARGE' };

  const existingGeneration = parseRecoveryGeneration(input.recoveryCode);
  const previousFailed = (input.recoveryCode || '').endsWith('_FAILED');

  if (!input.explicitAdminRecovery) {
    if (input.failedAttemptRecorded || existingGeneration) {
      return { action: 'wait', reason: 'CACHED_FAILURE_NEEDS_ADMIN_RECOVERY' };
    }
    return { action: 'wait', reason: 'FIRST_ATTEMPT_USES_ORIGINAL_KEY' };
  }

  let generation = existingGeneration ?? 1;
  if (existingGeneration && previousFailed && input.confirmNewGeneration) {
    generation = existingGeneration + 1;
  }
  return {
    action: 'create',
    generation,
    idempotencyKey: sellerTransferRecoveryIdempotencyKey(
      input.orderId,
      input.productId,
      input.chargeId,
      generation,
    ),
  };
}
