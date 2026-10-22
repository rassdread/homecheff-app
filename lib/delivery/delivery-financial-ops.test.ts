import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { courierTransferReady } from '@/lib/delivery/courier-connect-eligibility';
import {
  acceptanceMatchesCurrent,
  agreementContentHash,
  DELIVERY_AGREEMENT_VERSION,
} from '@/lib/delivery/delivery-agreement-version';
import {
  customerRefundStatus,
  executeDeliveryRefundDecision,
  refundIdempotencyKey,
  REFUND_STATUS_COPY,
} from '@/lib/delivery/delivery-refund-review';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';
import { isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';

test('delivery stays disabled unless the flag is explicitly enabled', () => {
  const previous = process.env.HOMECHEFF_DELIVERY_ENABLED;
  delete process.env.HOMECHEFF_DELIVERY_ENABLED;
  assert.equal(isHomeCheffDeliveryEnabled(), false);
  process.env.HOMECHEFF_DELIVERY_ENABLED = 'no';
  assert.equal(isHomeCheffDeliveryEnabled(), false);
  process.env.HOMECHEFF_DELIVERY_ENABLED = 'true';
  assert.equal(isHomeCheffDeliveryEnabled(), true);
  if (previous === undefined) delete process.env.HOMECHEFF_DELIVERY_ENABLED;
  else process.env.HOMECHEFF_DELIVERY_ENABLED = previous;
});

test('courier connect eligibility does not trust payouts_enabled', () => {
  assert.equal(courierTransferReady({ accountId: null, transfersStatus: 'active', checkedAt: new Date() }).code, 'COURIER_CONNECT_REQUIRED');
  assert.equal(courierTransferReady({ accountId: 'acct_test', transfersStatus: 'inactive', checkedAt: new Date() }).code, 'COURIER_CONNECT_INCOMPLETE');
  const stale = new Date(Date.now() - 16 * 60 * 1000);
  assert.equal(courierTransferReady({ accountId: 'acct_test', transfersStatus: 'active', checkedAt: stale }).code, 'COURIER_CONNECT_STALE');
  assert.equal(courierTransferReady({ accountId: 'acct_test', transfersStatus: 'active', checkedAt: new Date() }).ready, true);
});

test('agreement version is stable and old rows do not match a new hash', () => {
  const nl = agreementContentHash('nl');
  const en = agreementContentHash('en');
  assert.equal(agreementContentHash('nl'), nl);
  assert.notEqual(nl, en);
  assert.equal(acceptanceMatchesCurrent({ version: DELIVERY_AGREEMENT_VERSION, contentHash: nl, language: 'nl' }), true);
  assert.equal(acceptanceMatchesCurrent(null), false);
  assert.equal(acceptanceMatchesCurrent({ version: 'legacy', contentHash: nl, language: 'nl' }), false);
  assert.equal(acceptanceMatchesCurrent({ version: DELIVERY_AGREEMENT_VERSION, contentHash: 'changed', language: 'nl' }), false);
});

test('commission stays 12 percent platform and 88 percent courier', () => {
  const split = splitDeliveryCommission(10000);
  assert.equal(split.platformCommissionCents, 1200);
  assert.equal(split.providerNetPayoutCents, 8800);
});

test('refund status and idempotency stay explicit', () => {
  assert.equal(refundIdempotencyKey('job_1'), refundIdempotencyKey('job_1'));
  assert.equal(customerRefundStatus(null), 'UNDER_REVIEW');
  assert.equal(customerRefundStatus({ decision: 'REJECT', stripeStatus: 'rejected', stripeRefundId: null, outstandingCents: 0 }), 'REFUND_REJECTED');
  assert.equal(customerRefundStatus({ decision: 'APPROVE', stripeStatus: 'succeeded', stripeRefundId: 're_1', outstandingCents: 0 }), 'REFUNDED');
  assert.equal(customerRefundStatus({ decision: 'MANUAL', stripeStatus: 'MANUAL', stripeRefundId: null, outstandingCents: 880 }), 'MANUAL_RESOLUTION');
  assert.equal(REFUND_STATUS_COPY.REFUNDED.nl.includes('Stripe'), true);
  assert.equal(REFUND_STATUS_COPY.UNDER_REVIEW.en.includes('No money'), true);
});

test('payout and review paths keep the existing transfer and confirmation guards', () => {
  const payout = readFileSync(new URL('./delivery-payout.ts', import.meta.url), 'utf8');
  assert.equal(payout.includes('LEDGER_ONLY_NO_CONNECT'), true);
  assert.equal(payout.includes("transferStatus: 'FAILED'"), true);
  assert.equal(payout.includes('delivery_xfer_'), true);
  assert.equal(payout.includes('failed_connect_missing'), true);
  const review = readFileSync(new URL('./delivery-refund-review.ts', import.meta.url), 'utf8');
  assert.equal(review.includes('CONFIRMATION_REQUIRED'), true);
  assert.equal(review.includes('recoverCourierTransfer'), true);
  assert.equal(review.includes('createReversal'), true);
  const admin = readFileSync(new URL('../../app/api/admin/delivery-reviews/route.ts', import.meta.url), 'utf8');
  assert.equal(admin.includes('confirmFinancialPreview'), true);
  assert.equal(admin.includes("role !== 'ADMIN'"), true);
});

test('refund decision is idempotent against a fake Stripe client', async () => {
  const calls = { refunds: 0, reversals: 0, reversalAmounts: [] as number[] };
  const store: { row: Record<string, unknown> | null } = { row: null };
  const prisma = {
    deliveryOrder: {
      findUnique: async () => ({
        id: 'd1',
        orderId: 'o1',
        deliveryProfileId: 'p1',
        notes: '',
        deliveryProfile: { userId: 'courier' },
      }),
    },
    standaloneDeliveryRequest: {
      findFirst: async () => ({
        paymentStatus: 'PAID',
        stripeSessionId: 'cs_test',
        requesterUserId: 'buyer',
        buyerTotalCents: 1000,
        quotedFeeCents: 1000,
      }),
    },
    deliveryRefundDecision: {
      findUnique: async () => store.row,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (store.row) {
          const error = new Error('dup') as Error & { code?: string };
          error.code = 'P2002';
          throw error;
        }
        store.row = { id: 'dec1', ...data };
        return store.row;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        store.row = { ...store.row, ...data };
        return store.row;
      },
    },
    payout: { findFirst: async () => ({ providerRef: 'tr_test', amountCents: 880 }) },
    transaction: { findUnique: undefined },
  };
  const stripe = {
    checkout: { sessions: { retrieve: async () => ({ payment_intent: 'pi_test', amount_total: 1000 }) } },
    refunds: {
      create: async () => {
        calls.refunds += 1;
        return { id: 're_test', status: 'succeeded' };
      },
    },
    transfers: {
      createReversal: async (_id: string, params: { amount: number }) => {
        calls.reversals += 1;
        calls.reversalAmounts.push(params.amount);
        return { id: 'trr_test' };
      },
    },
  };
  const input = {
    deliveryOrderId: 'd1',
    adminUserId: 'admin',
    decision: 'APPROVE' as const,
    reason: 'Klant vroeg annulering voor ophalen',
    confirm: true,
  };
  const denied = await executeDeliveryRefundDecision(prisma as never, stripe as never, { ...input, confirm: false });
  assert.equal(denied.ok, false);
  const first = await executeDeliveryRefundDecision(prisma as never, stripe as never, input);
  assert.equal(first.ok, true);
  const second = await executeDeliveryRefundDecision(prisma as never, stripe as never, input);
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.duplicate, true);
  assert.equal(calls.refunds, 1);
  assert.equal(calls.reversals, 1);
  assert.equal(calls.reversalAmounts[0], 880);

  store.row = null;
  calls.refunds = 0;
  calls.reversals = 0;
  calls.reversalAmounts = [];
  const partial = await executeDeliveryRefundDecision(prisma as never, stripe as never, { ...input, amountCents: 100 });
  assert.equal(partial.ok, true);
  if (partial.ok) {
    assert.equal(partial.decision.stripeRefundId, 're_test');
    assert.equal(partial.decision.outstandingCents, 0);
  }
  assert.equal(calls.reversalAmounts[0], 88);
  assert.equal(calls.refunds, 1);

  store.row = null;
  calls.refunds = 0;
  stripe.transfers.createReversal = async () => {
    throw new Error('reversal failed');
  };
  const manual = await executeDeliveryRefundDecision(prisma as never, stripe as never, input);
  assert.equal(manual.ok, true);
  if (manual.ok) {
    assert.equal(manual.decision.stripeStatus, 'MANUAL');
    assert.equal(manual.decision.stripeRefundId, 're_test');
    assert.ok(manual.decision.outstandingCents > 0);
  }
  assert.equal(calls.refunds, 1);
  const retry = await executeDeliveryRefundDecision(prisma as never, stripe as never, input);
  assert.equal(retry.ok, true);
  assert.equal(calls.refunds, 1);
});
