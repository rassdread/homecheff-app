/** Stripe Connect transfers capability. payouts_enabled is not enough. */
export const COURIER_TRANSFER_FRESH_MS = 15 * 60 * 1000;

export function courierTransferReady(input: {
  accountId?: string | null;
  transfersStatus?: string | null;
  checkedAt?: Date | null;
  now?: Date;
}) {
  if (!input.accountId) {
    return { ready: false, stale: false, code: 'COURIER_CONNECT_REQUIRED' as const };
  }
  if (input.transfersStatus !== 'active' || !input.checkedAt) {
    return { ready: false, stale: true, code: 'COURIER_CONNECT_INCOMPLETE' as const };
  }
  const age = (input.now ?? new Date()).getTime() - input.checkedAt.getTime();
  if (age > COURIER_TRANSFER_FRESH_MS || age < 0) {
    return { ready: false, stale: true, code: 'COURIER_CONNECT_STALE' as const };
  }
  return { ready: true, stale: false, code: 'OK' as const };
}

/**
 * TRANSFER_ELIGIBLE is capabilities.transfers === active.
 * PAYOUT_READY also requires payouts_enabled. Unknown payout state is stale.
 */
export function courierPayoutReady(input: {
  accountId?: string | null;
  transfersStatus?: string | null;
  payoutsEnabled?: boolean | null;
  checkedAt?: Date | null;
  now?: Date;
}) {
  const transfer = courierTransferReady(input);
  if (!transfer.ready) {
    return { ...transfer, transferEligible: false, payoutReady: false };
  }
  if (input.payoutsEnabled == null) {
    return {
      ready: false,
      stale: true,
      code: 'COURIER_PAYOUT_NOT_READY' as const,
      transferEligible: true,
      payoutReady: false,
    };
  }
  if (input.payoutsEnabled !== true) {
    return {
      ready: false,
      stale: false,
      code: 'COURIER_PAYOUT_NOT_READY' as const,
      transferEligible: true,
      payoutReady: false,
    };
  }
  return {
    ready: true,
    stale: false,
    code: 'OK' as const,
    transferEligible: true,
    payoutReady: true,
  };
}

export function transfersStatusFromAccount(account: {
  capabilities?: { transfers?: string | null } | null;
}) {
  return account.capabilities?.transfers === 'active' ? 'active' : 'inactive';
}

export function payoutsEnabledFromAccount(account: { payouts_enabled?: boolean | null }) {
  return account.payouts_enabled === true;
}
