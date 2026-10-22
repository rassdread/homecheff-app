import { proportionalCents } from '@/lib/delivery/delivery-refund-books';

/**
 * Courier money after a customer refund.
 *
 * COURIER_ALLOCATED — no Stripe transfer exists, so local books are the recovery.
 * COURIER_TRANSFERRED — a transfer exists and nothing has been refunded.
 * COURIER_RECOVERY_REQUIRED — a refund exists and Stripe has not confirmed a reversal.
 * COURIER_RECOVERED — Stripe reversals cover the courier share of the refund.
 * COURIER_RECOVERY_OUTSTANDING — Stripe confirmed less than the courier share.
 *
 * A local earnings adjustment is not one of these recovered states.
 */
export type CourierRecoveryState =
  | 'COURIER_ALLOCATED'
  | 'COURIER_TRANSFERRED'
  | 'COURIER_RECOVERY_REQUIRED'
  | 'COURIER_RECOVERED'
  | 'COURIER_RECOVERY_OUTSTANDING';

export type StripeReversalRecord = { id: string; amount: number };

export type CourierRecoveryClient = {
  listReversals: (transferId: string) => Promise<StripeReversalRecord[]>;
  createReversal: (
    transferId: string,
    amountCents: number,
    idempotencyKey: string,
  ) => Promise<StripeReversalRecord>;
};

export function courierRecoveryIdempotencyKey(
  transferId: string,
  alreadyReversedCents: number,
  additionalCents: number,
) {
  return `delivery_recover_${transferId}_${alreadyReversedCents}_${additionalCents}`;
}

export function courierShareToRecoverCents(input: {
  transferredCents: number;
  refundedCents: number;
  chargeCents: number;
}) {
  return proportionalCents(input.transferredCents, input.refundedCents, input.chargeCents);
}

function reversalTotal(rows: StripeReversalRecord[]) {
  return rows.reduce((sum, row) => sum + Math.max(0, Math.trunc(row.amount || 0)), 0);
}

export function stripeErrorCategory(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
  if (code) return code.slice(0, 80);
  const message = error instanceof Error ? error.message : '';
  if (/timeout|timed out|ETIMEDOUT|ECONNRESET|socket hang up/i.test(message)) return 'timeout';
  if (/idempoten/i.test(message)) return 'idempotency';
  if (/insufficient/i.test(message)) return 'insufficient_funds';
  return 'stripe_error';
}

function isDefiniteReversalFailure(category: string) {
  return (
    category === 'insufficient_funds'
    || category === 'balance_insufficient'
    || category === 'transfer_already_reversed'
  );
}

export async function recoverCourierTransfer(input: {
  transferId: string | null;
  transferredCents: number;
  refundedCents: number;
  chargeCents: number;
  stripe: CourierRecoveryClient;
}): Promise<{
  state: CourierRecoveryState;
  requiredCents: number;
  recoveredCents: number;
  outstandingCents: number;
  reversalId: string | null;
  created: boolean;
  uncertain: boolean;
}> {
  const transferredCents = Math.trunc(Number(input.transferredCents));
  const transferId = input.transferId?.startsWith('tr_') ? input.transferId : null;
  if (transferId && (!Number.isInteger(transferredCents) || transferredCents <= 0)) {
    return {
      state: 'COURIER_RECOVERY_REQUIRED',
      requiredCents: 0,
      recoveredCents: 0,
      outstandingCents: 0,
      reversalId: null,
      created: false,
      uncertain: true,
    };
  }
  if (!transferId || transferredCents <= 0) {
    return {
      state: 'COURIER_ALLOCATED',
      requiredCents: 0,
      recoveredCents: 0,
      outstandingCents: 0,
      reversalId: null,
      created: false,
      uncertain: false,
    };
  }
  if (input.refundedCents <= 0) {
    return {
      state: 'COURIER_TRANSFERRED',
      requiredCents: 0,
      recoveredCents: 0,
      outstandingCents: 0,
      reversalId: null,
      created: false,
      uncertain: false,
    };
  }

  const requiredCents = Math.min(
    transferredCents,
    courierShareToRecoverCents({
      transferredCents,
      refundedCents: input.refundedCents,
      chargeCents: input.chargeCents,
    }),
  );

  let listed: StripeReversalRecord[];
  try {
    listed = await input.stripe.listReversals(transferId);
  } catch {
    return {
      state: 'COURIER_RECOVERY_REQUIRED',
      requiredCents,
      recoveredCents: 0,
      outstandingCents: requiredCents,
      reversalId: null,
      created: false,
      uncertain: true,
    };
  }

  const adopt = (rows: StripeReversalRecord[], created: boolean) => {
    const recoveredCents = Math.min(transferredCents, reversalTotal(rows));
    const outstandingCents = Math.max(0, requiredCents - recoveredCents);
    const reversalId = rows.length > 0 ? rows[rows.length - 1].id : null;
    const state: CourierRecoveryState = outstandingCents === 0 && recoveredCents >= requiredCents
      ? 'COURIER_RECOVERED'
      : recoveredCents > 0
        ? 'COURIER_RECOVERY_OUTSTANDING'
        : 'COURIER_RECOVERY_REQUIRED';
    return {
      state,
      requiredCents,
      recoveredCents,
      outstandingCents,
      reversalId,
      created,
      uncertain: false,
    };
  };

  const already = adopt(listed, false);
  if (already.recoveredCents >= requiredCents) return already;

  const additional = requiredCents - already.recoveredCents;
  const room = transferredCents - already.recoveredCents;
  if (room <= 0 || additional <= 0) {
    return { ...already, state: 'COURIER_RECOVERY_OUTSTANDING' };
  }
  const toReverse = Math.min(additional, room);
  const idempotencyKey = courierRecoveryIdempotencyKey(transferId, already.recoveredCents, toReverse);

  try {
    const created = await input.stripe.createReversal(transferId, toReverse, idempotencyKey);
    const known = listed.some((row) => row.id === created.id);
    return adopt(known ? listed : [...listed, created], !known);
  } catch (error) {
    const category = stripeErrorCategory(error);
    try {
      const again = await input.stripe.listReversals(transferId);
      const adopted = adopt(again, false);
      if (adopted.recoveredCents > already.recoveredCents) return adopted;
    } catch {
      return {
        state: 'COURIER_RECOVERY_REQUIRED',
        requiredCents,
        recoveredCents: already.recoveredCents,
        outstandingCents: requiredCents - already.recoveredCents,
        reversalId: already.reversalId,
        created: false,
        uncertain: true,
      };
    }
    if (isDefiniteReversalFailure(category)) {
      return {
        state: 'COURIER_RECOVERY_OUTSTANDING',
        requiredCents,
        recoveredCents: already.recoveredCents,
        outstandingCents: requiredCents - already.recoveredCents,
        reversalId: already.reversalId,
        created: false,
        uncertain: false,
      };
    }
    return {
      state: 'COURIER_RECOVERY_REQUIRED',
      requiredCents,
      recoveredCents: already.recoveredCents,
      outstandingCents: requiredCents - already.recoveredCents,
      reversalId: already.reversalId,
      created: false,
      uncertain: true,
    };
  }
}
