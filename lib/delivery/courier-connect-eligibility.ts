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

export function transfersStatusFromAccount(account: {
  capabilities?: { transfers?: string | null } | null;
}) {
  return account.capabilities?.transfers === 'active' ? 'active' : 'inactive';
}
