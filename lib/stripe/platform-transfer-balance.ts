/**
 * Read-only platform balance for Connect transfers.
 * A failed read is unknown. Unknown is never reported as €0.
 * available.eur is the payments bucket that transfers.create debits.
 * This does not prove that top-up funds and charge funds are interchangeable.
 */

export type PlatformTransferBalance = {
  known: boolean;
  availableCents: number | null;
  pendingCents: number | null;
  currency: string | null;
  livemode: boolean | null;
  balanceType: 'payments';
};

const UNKNOWN: PlatformTransferBalance = {
  known: false,
  availableCents: null,
  pendingCents: null,
  currency: null,
  livemode: null,
  balanceType: 'payments',
};

type BalanceClient = {
  balance: {
    retrieve: () => Promise<{
      livemode?: boolean;
      available?: Array<{ amount?: number; currency?: string }>;
      pending?: Array<{ amount?: number; currency?: string }>;
    }>;
  };
};

export async function readPlatformTransferBalance(client?: BalanceClient | null): Promise<PlatformTransferBalance> {
  try {
    const stripeClient = client === undefined ? ((await import('@/lib/stripe')).stripe as BalanceClient | null) : client;
    if (!stripeClient) return UNKNOWN;
    const balance = await stripeClient.balance.retrieve();
    const available = (balance.available ?? []).find((row) => row.currency === 'eur');
    const pending = (balance.pending ?? []).find((row) => row.currency === 'eur');
    if (!available || typeof available.amount !== 'number' || !Number.isFinite(available.amount)) return UNKNOWN;
    return {
      known: true,
      availableCents: available.amount,
      pendingCents: typeof pending?.amount === 'number' ? pending.amount : 0,
      currency: 'eur',
      livemode: balance.livemode === true,
      balanceType: 'payments',
    };
  } catch {
    return UNKNOWN;
  }
}
