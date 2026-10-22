import { createHash } from 'node:crypto';
import { CommissionLedgerStatus, type Prisma, type PrismaClient } from '@prisma/client';

/**
 * Crash-safe affiliate payout.
 *
 * The payout id is a hash of the claimed commission ids. That id is also the
 * Stripe idempotency key and the transfer_group. Commission rows are claimed
 * by writing payoutIntentId into their existing meta before Stripe is called.
 * A row is marked PAID only after the transfer id is stored. A missing local
 * transfer id is reconciled against Stripe before any second transfer.
 */

export type PayableCommission = {
  id: string;
  amountCents: number;
  status: string;
  availableAt: Date | string | null;
  meta?: unknown;
};

export type PayoutRecord = {
  id: string;
  status: string;
  stripeTransferId: string | null;
  amountCents: number;
};

export type AffiliatePayoutStore = {
  findPayout: (id: string) => Promise<PayoutRecord | null>;
  createPayout: (input: {
    id: string;
    affiliateId: string;
    amountCents: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
  }) => Promise<'created' | 'exists'>;
  saveTransfer: (id: string, stripeTransferId: string) => Promise<void>;
  markFailed: (id: string) => Promise<void>;
  claim: (ids: string[], intentId: string) => Promise<string[]>;
  markPaid: (ids: string[], intentId: string, stripeTransferId: string) => Promise<void>;
};

export type AffiliateTransferClient = {
  findTransfer: (intentId: string) => Promise<{ id: string } | null>;
  createTransfer: (input: {
    amountCents: number;
    currency: string;
    destinationAccountId: string;
    intentId: string;
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
};

export function payoutIntentOf(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const value = (meta as { payoutIntentId?: unknown }).payoutIntentId;
  return typeof value === 'string' && value.startsWith('affpay_') ? value : null;
}

export function affiliatePayoutIntentId(affiliateId: string, commissionIds: string[]) {
  const hash = createHash('sha256')
    .update([...commissionIds].sort().join(','))
    .digest('hex')
    .slice(0, 32);
  return `affpay_${affiliateId}_${hash}`;
}

export function isPayableCommission(row: PayableCommission, now: Date) {
  if (row.status !== 'AVAILABLE') return false;
  if (!Number.isInteger(row.amountCents) || row.amountCents <= 0) return false;
  if (!row.availableAt) return false;
  return new Date(row.availableAt).getTime() <= now.getTime();
}

function metaObject(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  return { ...(meta as Record<string, unknown>) };
}

function errorCategory(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
  if (code) return code.slice(0, 80);
  const message = error instanceof Error ? error.message : '';
  if (/timeout|timed out|ETIMEDOUT|ECONNRESET|socket hang up/i.test(message)) return 'timeout';
  if (/insufficient/i.test(message)) return 'insufficient_funds';
  return 'stripe_error';
}

function isDefiniteTransferFailure(category: string) {
  return (
    category === 'insufficient_funds'
    || category === 'balance_insufficient'
    || category === 'account_invalid'
    || category === 'transfers_not_allowed'
  );
}

export async function claimCommissionRows(
  db: PrismaClient,
  ids: string[],
  intentId: string,
): Promise<string[]> {
  try {
    return await db.$transaction(async (tx) => {
      const rows = await tx.commissionLedger.findMany({ where: { id: { in: ids } } });
      if (rows.length !== ids.length) return [];
      for (const row of rows) {
        const owner = payoutIntentOf(row.meta);
        if (row.status !== CommissionLedgerStatus.AVAILABLE) return [];
        if (row.amountCents <= 0) return [];
        if (owner && owner !== intentId) return [];
      }
      for (const row of rows) {
        await tx.commissionLedger.update({
          where: { id: row.id },
          data: { meta: { ...metaObject(row.meta), payoutIntentId: intentId } as Prisma.InputJsonValue },
        });
      }
      return [...ids];
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
    if (code === 'P2034') return [];
    throw error;
  }
}

export async function markClaimedCommissionsPaid(
  db: PrismaClient,
  ids: string[],
  intentId: string,
  stripeTransferId: string,
) {
  await db.$transaction(async (tx) => {
    for (const id of ids) {
      const row = await tx.commissionLedger.findUnique({ where: { id } });
      if (!row || row.status !== CommissionLedgerStatus.AVAILABLE) continue;
      if (payoutIntentOf(row.meta) !== intentId) continue;
      await tx.commissionLedger.update({
        where: { id },
        data: {
          status: CommissionLedgerStatus.PAID,
          meta: { ...metaObject(row.meta), payoutIntentId: intentId, stripeTransferId } as Prisma.InputJsonValue,
        },
      });
    }
  });
}

export async function settleAffiliatePayout(input: {
  affiliateId: string;
  commissions: PayableCommission[];
  currency: string;
  destinationAccountId: string | null;
  onboardingCompleted: boolean;
  periodStart: Date;
  periodEnd: Date;
  minimumCents: number;
  resume: boolean;
  store: AffiliatePayoutStore;
  stripe: AffiliateTransferClient;
}): Promise<{
  outcome: 'paid' | 'already_paid' | 'failed' | 'uncertain' | 'skipped' | 'concurrent';
  intentId: string | null;
  stripeTransferId: string | null;
  reason?: string;
}> {
  const ids = input.commissions.map((row) => row.id);
  if (ids.length === 0) {
    return { outcome: 'skipped', intentId: null, stripeTransferId: null, reason: 'empty' };
  }
  const amountCents = input.commissions.reduce((sum, row) => sum + row.amountCents, 0);
  const intentId = affiliatePayoutIntentId(input.affiliateId, ids);
  if (!input.destinationAccountId || !input.onboardingCompleted) {
    return { outcome: 'skipped', intentId, stripeTransferId: null, reason: 'connect' };
  }
  if (!input.resume && amountCents < input.minimumCents) {
    return { outcome: 'skipped', intentId, stripeTransferId: null, reason: 'below_minimum' };
  }

  const existing = await input.store.findPayout(intentId);
  if (existing?.stripeTransferId && existing.status === 'SENT') {
    await input.store.markPaid(ids, intentId, existing.stripeTransferId);
    return { outcome: 'already_paid', intentId, stripeTransferId: existing.stripeTransferId };
  }

  const claimed = await input.store.claim(ids, intentId);
  if (claimed.length !== ids.length) {
    return { outcome: 'concurrent', intentId, stripeTransferId: existing?.stripeTransferId ?? null };
  }

  if (!existing) {
    await input.store.createPayout({
      id: intentId,
      affiliateId: input.affiliateId,
      amountCents,
      currency: input.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
  }

  const known = await input.stripe.findTransfer(intentId);
  if (known?.id) {
    await input.store.saveTransfer(intentId, known.id);
    await input.store.markPaid(ids, intentId, known.id);
    return { outcome: 'paid', intentId, stripeTransferId: known.id };
  }

  try {
    const transfer = await input.stripe.createTransfer({
      amountCents,
      currency: input.currency,
      destinationAccountId: input.destinationAccountId,
      intentId,
      idempotencyKey: intentId,
    });
    if (!transfer.id.startsWith('tr_')) {
      await input.store.markFailed(intentId);
      return { outcome: 'failed', intentId, stripeTransferId: null, reason: 'invalid_transfer' };
    }
    await input.store.saveTransfer(intentId, transfer.id);
    await input.store.markPaid(ids, intentId, transfer.id);
    return { outcome: 'paid', intentId, stripeTransferId: transfer.id };
  } catch (error) {
    const category = errorCategory(error);
    const adopted = await input.stripe.findTransfer(intentId).catch(() => null);
    if (adopted?.id) {
      await input.store.saveTransfer(intentId, adopted.id);
      await input.store.markPaid(ids, intentId, adopted.id);
      return { outcome: 'paid', intentId, stripeTransferId: adopted.id };
    }
    if (isDefiniteTransferFailure(category)) {
      await input.store.markFailed(intentId);
      return { outcome: 'failed', intentId, stripeTransferId: null, reason: category };
    }
    return { outcome: 'uncertain', intentId, stripeTransferId: null, reason: category };
  }
}
