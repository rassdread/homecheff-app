/**
 * Focused delivery financial tests.
 * Stripe clients here are in-memory fakes. They are not Stripe integration tests.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
  calculateStripeFeeForBuyer,
} from '@/lib/fees';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import { splitAffiliateLineForHierarchy } from '@/lib/affiliates/main-partner-split';
import { ensureDeliveryPayout } from '@/lib/delivery/delivery-payout';
import {
  courierClawbackCents,
  proportionalCents,
  reconcileDeliveryRefundBooks,
} from '@/lib/delivery/delivery-refund-books';
import { executeDeliveryRefundDecision } from '@/lib/delivery/delivery-refund-review';
import { observeStandaloneChargeRefund } from '@/lib/delivery/delivery-webhook-events';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

const SOURCE = 'req_1_delivery_d1';

test('approved shares and the unchanged surcharge estimate stay exact', () => {
  assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
  assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
  const split = splitDeliveryCommission(1000);
  assert.equal(split.providerNetPayoutCents, 880);
  assert.equal(split.platformCommissionCents, 120);
  assert.equal(split.providerNetPayoutCents + split.platformCommissionCents, 1000);
  const buyer = calculateStripeFeeForBuyer(1000);
  assert.equal(buyer.buyerTotalCents, 1040);
  assert.equal(buyer.stripeFeeCents, 40);
  const samples = [
    [500, 440, 60, 533, 33],
    [1000, 880, 120, 1040, 40],
    [2500, 2200, 300, 2561, 61],
    [5000, 4400, 600, 5097, 97],
  ] as const;
  for (const [gross, courier, platform, total, surcharge] of samples) {
    const row = splitDeliveryCommission(gross);
    const fee = calculateStripeFeeForBuyer(gross);
    assert.equal(row.providerNetPayoutCents, courier);
    assert.equal(row.platformCommissionCents, platform);
    assert.equal(row.providerNetPayoutCents + row.platformCommissionCents, gross);
    assert.equal(fee.buyerTotalCents, total);
    assert.equal(fee.stripeFeeCents, surcharge);
  }
  const pool = allocateMarketplaceAffiliatePool({
    platformFeeCents: 120,
    buyerAffiliateId: 'aff_buyer',
    sellerAffiliateId: null,
  });
  assert.equal(pool.lines[0]?.commissionCents, 60);
  const partner = splitAffiliateLineForHierarchy({ lineCents: 60, isPartner: true });
  assert.equal(partner.mainOverrideCents, 12);
  assert.equal(partner.partnerOrDirectCents, 48);
  assert.equal(partner.totalCents, 60);
  const none = allocateMarketplaceAffiliatePool({
    platformFeeCents: 120,
    buyerAffiliateId: null,
    sellerAffiliateId: null,
  });
  assert.equal(none.lines.length, 0);
  assert.equal(proportionalCents(880, 1040, 1040), 880);
  assert.equal(proportionalCents(60, 1040, 1040), 60);
  assert.equal(courierClawbackCents({ courierAllocationCents: 880, refundedCents: 520, chargeCents: 1040 }), 440);
  assert.equal(proportionalCents(60, 520, 1040), 30);
});

type TransferCall = {
  amount: number;
  source: string | undefined;
  key: string;
  metadata: Record<string, string>;
  transferId?: string;
};

function courierProfile() {
  return {
    id: 'p1',
    userId: 'courier',
    isVerified: true,
    isActive: true,
    age: 36,
    stripeTransfersStatus: 'active',
    stripePayoutsEnabled: true,
    stripeTransfersCheckedAt: new Date(),
    user: {
      id: 'courier',
      dateOfBirth: new Date('1990-01-01T00:00:00Z'),
      stripeConnectAccountId: 'acct_test',
      stripeConnectOnboardingCompleted: true,
    },
  };
}

function payoutHarness(options?: {
  status?: string;
  order?: { stripeSessionId: string; paymentMethod: string } | null;
  standalone?: { stripeSessionId: string; paymentStatus: string } | null;
  payout?: Record<string, unknown> | null;
  failMessage?: string | null;
  listed?: Array<Record<string, unknown>>;
}) {
  const calls: TransferCall[] = [];
  const profile = courierProfile();
  let payout = options?.payout === undefined
    ? {
        id: 'payout_delivery_d1',
        amountCents: 880,
        providerRef: null as string | null,
        destinationConnectAccountId: null as string | null,
        transferFailureCode: null as string | null,
        transferFailureAt: null as Date | null,
        toUserId: 'courier',
      }
    : options.payout;
  let failMessage = options?.failMessage ?? null;
  const listed = options?.listed ?? [];
  let standaloneReads = 0;
  const stripe = {
    checkout: {
      sessions: {
        retrieve: async (id: string) => {
          const charges: Record<string, { id: string; amount: number } | null> = {
            cs_market: { id: 'ch_market', amount: 1040 },
            cs_standalone: { id: 'ch_standalone', amount: 1040 },
            cs_small: { id: 'ch_small', amount: 100 },
          };
          const charge = charges[id] ?? null;
          return {
            id,
            payment_intent: { id: `pi_${id}`, latest_charge: charge },
          };
        },
      },
    },
    transfers: {
      list: async () => ({ data: listed }),
      create: async (params: Record<string, unknown>, opts: { idempotencyKey: string }) => {
        const key = opts.idempotencyKey;
        const existing = calls.find((call) => call.key === key && call.source !== 'FAILED');
        if (existing?.transferId) return { id: existing.transferId, amount: params.amount, metadata: params.metadata };
        const call: TransferCall = {
          amount: Number(params.amount),
          source: params.source_transaction as string | undefined,
          key,
          metadata: params.metadata as Record<string, string>,
        };
        calls.push(call);
        if (failMessage) {
          const message = failMessage;
          failMessage = null;
          call.source = 'FAILED';
          throw new Error(message);
        }
        call.transferId = `tr_${calls.length}`;
        return { id: call.transferId, amount: params.amount, metadata: params.metadata };
      },
    },
  };
  const prisma = {
    deliveryProfile: {
      findUnique: async () => profile,
      updateMany: async () => ({ count: 0 }),
    },
    deliveryOrder: {
      findUnique: async () => ({
        quotedFeeCents: 1000,
        deliveryFee: 1000,
        status: options?.status ?? 'DELIVERED',
        notes: null,
      }),
    },
    order: {
      findUnique: async () => (options?.order === undefined ? null : options.order),
    },
    standaloneDeliveryRequest: {
      findFirst: async () => {
        standaloneReads += 1;
        return options?.standalone === undefined
          ? { stripeSessionId: 'cs_standalone', paymentStatus: 'PAID' }
          : options.standalone;
      },
    },
    payout: {
      findFirst: async () => payout,
      findUnique: async () => payout,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        payout = { ...(payout ?? {}), ...data };
        return payout;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        payout = data as typeof payout;
        return payout;
      },
    },
    transaction: {
      findUnique: async () => ({ id: 'txn_delivery_d1' }),
      findFirst: async () => null,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };
  return {
    calls,
    stripe,
    prisma,
    standaloneReads: () => standaloneReads,
    payout: () => payout,
    failNext(message: string) {
      failMessage = message;
    },
  };
}

const payoutInput = {
  deliveryOrderId: 'd1',
  orderId: 'd1',
  delivererUserId: 'courier',
  buyerUserId: 'buyer',
};

test('standalone transfer uses the customer charge and marketplace orders keep theirs', async () => {
  const standalone = payoutHarness();
  const moved = await ensureDeliveryPayout(standalone.prisma as never, payoutInput, {
    stripe: standalone.stripe as never,
  });
  assert.equal(moved.transferStatus, 'SUCCEEDED');
  assert.equal(moved.amountCents, 880);
  assert.equal(moved.transferId?.startsWith('tr_'), true);
  assert.equal(standalone.calls[0].source, 'ch_standalone');
  assert.equal(standalone.calls[0].amount, 880);
  assert.equal(standalone.payout()?.providerRef, moved.transferId);

  const again = await ensureDeliveryPayout(standalone.prisma as never, payoutInput, {
    stripe: standalone.stripe as never,
  });
  assert.equal(again.transferStatus, 'ALREADY_DONE');
  assert.equal(standalone.calls.length, 1);

  const market = payoutHarness({
    order: { stripeSessionId: 'cs_market', paymentMethod: 'IDEAL' },
  });
  market.prisma.standaloneDeliveryRequest.findFirst = async () => {
    throw new Error('marketplace payout must not read a standalone request');
  };
  const marketResult = await ensureDeliveryPayout(
    market.prisma as never,
    { ...payoutInput, orderId: 'order_1' },
    { stripe: market.stripe as never },
  );
  assert.equal(marketResult.transferStatus, 'SUCCEEDED');
  assert.equal(market.calls[0].source, 'ch_market');
  assert.equal(market.calls[0].key.includes('ch_market'), true);

  const hcOnly = payoutHarness({
    order: { stripeSessionId: 'cs_market', paymentMethod: 'HC_ONLY' },
    standalone: null,
  });
  const balance = await ensureDeliveryPayout(hcOnly.prisma as never, { ...payoutInput, orderId: 'order_hc' }, {
    stripe: hcOnly.stripe as never,
  });
  assert.equal(balance.transferStatus, 'SUCCEEDED');
  assert.equal(hcOnly.calls[0].source, undefined);
});

test('failed, retried, missing, early, and duplicate transfers stay inside the courier allocation', async () => {
  const failed = payoutHarness({ failMessage: 'You have insufficient available funds in your Stripe account' });
  const first = await ensureDeliveryPayout(failed.prisma as never, payoutInput, { stripe: failed.stripe as never });
  assert.equal(first.transferStatus, 'FAILED');
  assert.equal(first.blockCode, 'INSUFFICIENT_BALANCE');
  assert.equal(String(failed.payout()?.providerRef ?? '').startsWith('tr_'), false);
  const retried = await ensureDeliveryPayout(failed.prisma as never, payoutInput, { stripe: failed.stripe as never });
  assert.equal(retried.transferStatus, 'SUCCEEDED');
  assert.equal(retried.transferId?.startsWith('tr_'), true);
  assert.notEqual(failed.calls[0].key, failed.calls[1].key);
  assert.equal(failed.calls[1].source, 'ch_standalone');

  const missing = payoutHarness({ standalone: { stripeSessionId: 'cs_missing', paymentStatus: 'PAID' } });
  const blocked = await ensureDeliveryPayout(missing.prisma as never, payoutInput, { stripe: missing.stripe as never });
  assert.equal(blocked.blockCode, 'SOURCE_CHARGE_MISSING');
  assert.equal(missing.calls.length, 0);

  const early = payoutHarness({ status: 'PENDING' });
  const skipped = await ensureDeliveryPayout(early.prisma as never, payoutInput, { stripe: early.stripe as never });
  assert.equal(skipped.blockCode, 'DELIVERY_NOT_COMPLETE');
  assert.equal(early.calls.length, 0);

  const tooBig = payoutHarness({ standalone: { stripeSessionId: 'cs_small', paymentStatus: 'PAID' } });
  const exceeded = await ensureDeliveryPayout(tooBig.prisma as never, payoutInput, { stripe: tooBig.stripe as never });
  assert.equal(exceeded.blockCode, 'TRANSFER_EXCEEDS_SOURCE');
  assert.equal(tooBig.calls.length, 0);

  const adopted = payoutHarness({
    listed: [{ id: 'tr_existing', amount: 880, reversed: false, metadata: { deliveryOrderId: 'd1' } }],
  });
  const found = await ensureDeliveryPayout(adopted.prisma as never, payoutInput, { stripe: adopted.stripe as never });
  assert.equal(found.transferStatus, 'ALREADY_DONE');
  assert.equal(found.transferId, 'tr_existing');
  assert.equal(adopted.calls.length, 0);

  const concurrent = payoutHarness();
  let gate: Promise<void> = Promise.resolve();
  let release = () => {};
  gate = new Promise((resolve) => {
    release = resolve;
  });
  const original = concurrent.stripe.transfers.create;
  concurrent.stripe.transfers.create = async (params, opts) => {
    await gate;
    return original(params, opts);
  };
  const both = Promise.all([
    ensureDeliveryPayout(concurrent.prisma as never, payoutInput, { stripe: concurrent.stripe as never }),
    ensureDeliveryPayout(concurrent.prisma as never, payoutInput, { stripe: concurrent.stripe as never }),
  ]);
  release();
  const [left, right] = await both;
  assert.equal(left.transferId, right.transferId);
  assert.equal(left.transferId?.startsWith('tr_'), true);
  assert.equal(concurrent.calls.length, 1);
  assert.equal(concurrent.payout()?.providerRef, left.transferId);
});

function matches(row: Record<string, unknown>, where: Record<string, unknown> | undefined): boolean {
  if (!where) return true;
  const or = where.OR as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(or) && !or.some((part) => matches(row, part))) return false;
  const eventType = where.eventType as { in?: string[] } | string | undefined;
  if (eventType) {
    const allowed = typeof eventType === 'string' ? [eventType] : eventType.in ?? [];
    if (!allowed.includes(String(row.eventType))) return false;
  }
  const status = where.status as { in?: string[] } | undefined;
  if (status?.in && !status.in.includes(String(row.status))) return false;
  const eventId = where.eventId as { startsWith?: string } | string | undefined;
  if (typeof eventId === 'string' && row.eventId !== eventId) return false;
  if (eventId && typeof eventId === 'object' && eventId.startsWith && !String(row.eventId).startsWith(eventId.startsWith)) {
    return false;
  }
  if (where.meta) return false;
  if (where.transactionId && row.transactionId !== where.transactionId) return false;
  return true;
}

function books(options?: { ledger?: boolean; paid?: boolean; earnings?: number; providerRef?: string | null }) {
  const ledgers: Array<Record<string, unknown>> = [];
  if (options?.ledger !== false) {
    ledgers.push({
      id: 'led_original',
      eventId: `${SOURCE}:aff_1:BUYER`,
      eventType: 'ORDER_PAID',
      affiliateId: 'aff_1',
      amountCents: 60,
      currency: 'eur',
      status: options?.paid ? 'PAID' : 'PENDING',
      meta: { orderId: SOURCE },
    });
  }
  const refunds: Array<Record<string, unknown>> = [];
  const order = {
    id: 'd1',
    status: 'DELIVERED',
    quotedFeeCents: 1000,
    deliveryFee: 1000,
    deliveryProfileId: 'p1',
    notes: null,
  };
  const profile = { id: 'p1', totalEarnings: options?.earnings ?? 880 };
  const txn = { id: 'txn_delivery_d1', status: 'CAPTURED', Refund: refunds };
  const db = {
    deliveryOrder: { findUnique: async () => order },
    deliveryProfile: {
      update: async ({ data }: { data: { totalEarnings?: { decrement: number } } }) => {
        if (data.totalEarnings?.decrement) profile.totalEarnings -= data.totalEarnings.decrement;
        return profile;
      },
    },
    transaction: {
      findUnique: async () => txn,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(txn, data);
        return txn;
      },
    },
    refund: {
      findMany: async ({ where }: { where?: Record<string, unknown> }) => refunds.filter((row) => matches(row, where)),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (refunds.some((row) => row.id === data.id)) {
          const error = new Error('dup') as Error & { code?: string };
          error.code = 'P2002';
          throw error;
        }
        refunds.push(data);
        return data;
      },
    },
    commissionLedger: {
      findMany: async ({ where }: { where?: Record<string, unknown> }) => ledgers.filter((row) => matches(row, where)),
      findUnique: async ({ where }: { where: { eventId: string } }) =>
        ledgers.find((row) => row.eventId === where.eventId) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (ledgers.some((row) => row.eventId === data.eventId)) {
          const error = new Error('dup') as Error & { code?: string };
          error.code = 'P2002';
          throw error;
        }
        const row = { id: `led_${ledgers.length + 1}`, currency: 'eur', status: 'PENDING', ...data };
        ledgers.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = ledgers.find((item) => item.id === where.id);
        if (!row) throw new Error('missing ledger');
        Object.assign(row, data);
        return row;
      },
    },
    payout: {
      findUnique: async () => ({ providerRef: options?.providerRef ?? null, amountCents: 880 }),
    },
    standaloneDeliveryRequest: {
      findUnique: async () => ({ id: 'req_1', deliveryOrderId: 'd1', buyerTotalCents: 1040 }),
    },
    deliveryRefundDecision: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => data,
    },
  };
  return { db, ledgers, refunds, order, profile, txn };
}

function payable(ledgers: Array<Record<string, unknown>>) {
  return ledgers
    .filter((row) => row.status === 'PENDING' || row.status === 'AVAILABLE')
    .reduce((sum, row) => sum + Number(row.amountCents), 0);
}

test('refunds claw courier earnings and affiliate commission without rewriting delivery status', async () => {
  const full = books();
  const first = await reconcileDeliveryRefundBooks(full.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 1040,
    chargeCents: 1040,
    stripeRefundId: 're_full',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  assert.equal(first.courierDeltaCents, 880);
  assert.equal(full.profile.totalEarnings, 0);
  assert.equal(full.order.status, 'DELIVERED');
  assert.equal(full.txn.status, 'REFUNDED');
  assert.equal(payable(full.ledgers), 0);
  assert.equal(full.ledgers.some((row) => row.id === 'led_original'), true);
  const replay = await reconcileDeliveryRefundBooks(full.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 1040,
    chargeCents: 1040,
    stripeRefundId: 're_full',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  assert.equal(replay.courierDeltaCents, 0);
  assert.equal(full.profile.totalEarnings, 0);
  assert.equal(full.refunds.length, 1);

  const partial = books();
  const part = await reconcileDeliveryRefundBooks(partial.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 520,
    chargeCents: 1040,
    stripeRefundId: 're_part',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  assert.equal(part.courierDeltaCents, 440);
  assert.equal(partial.profile.totalEarnings, 440);
  assert.equal(partial.txn.status, 'CAPTURED');
  assert.equal(payable(partial.ledgers), 30);
  assert.equal(partial.order.status, 'DELIVERED');
  const rest = await reconcileDeliveryRefundBooks(partial.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 1040,
    chargeCents: 1040,
    stripeRefundId: 're_rest',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  assert.equal(rest.courierDeltaCents, 440);
  assert.equal(partial.profile.totalEarnings, 0);
  assert.equal(payable(partial.ledgers), 0);
  assert.equal(partial.order.status, 'DELIVERED');

  const paid = books({ paid: true });
  await reconcileDeliveryRefundBooks(paid.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 1040,
    chargeCents: 1040,
    stripeRefundId: 're_paid',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  const original = paid.ledgers.find((row) => row.id === 'led_original');
  assert.equal(original?.amountCents, 60);
  assert.ok(paid.ledgers.some((row) => Number(row.amountCents) < 0));

  const none = books({ ledger: false });
  const quiet = await reconcileDeliveryRefundBooks(none.db as never, {
    deliveryOrderId: 'd1',
    refundedCents: 1040,
    chargeCents: 1040,
    stripeRefundId: 're_none',
    clawbackCourier: true,
    affiliateSourceOrderId: SOURCE,
  });
  assert.equal(quiet.affiliateReversedCents, 0);
  assert.equal(none.profile.totalEarnings, 0);

  const before = books();
  const decisions = new Map<string, Record<string, unknown>>();
  before.db.deliveryRefundDecision = {
    findUnique: async ({ where }: { where: { idempotencyKey: string } }) => decisions.get(where.idempotencyKey) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      decisions.set(String(data.idempotencyKey), data);
      return data;
    },
  } as typeof before.db.deliveryRefundDecision;
  const charge = {
    id: 'ch_before',
    amount: 1040,
    amount_refunded: 1040,
    currency: 'eur',
    payment_intent: 'pi_before',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  };
  await observeStandaloneChargeRefund(before.db as never, charge);
  assert.equal(before.profile.totalEarnings, 0);
  assert.equal(before.order.status, 'DELIVERED');
  await observeStandaloneChargeRefund(before.db as never, charge);
  assert.equal(before.profile.totalEarnings, 0);
  assert.equal(before.refunds.length, 1);
  assert.equal(payable(before.ledgers), 0);

  const held = books({ providerRef: 'tr_held' });
  const heldDecisions = new Map<string, Record<string, unknown>>();
  held.db.deliveryRefundDecision = {
    findUnique: async ({ where }: { where: { idempotencyKey: string } }) => heldDecisions.get(where.idempotencyKey) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      heldDecisions.set(String(data.idempotencyKey), data);
      return data;
    },
  } as typeof held.db.deliveryRefundDecision;
  const observed = await observeStandaloneChargeRefund(held.db as never, {
    id: 'ch_held',
    amount: 1040,
    amount_refunded: 1040,
    currency: 'eur',
    payment_intent: 'pi_held',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  });
  assert.equal(observed.handled, true);
  assert.equal(held.profile.totalEarnings, 880);
  const observedAgain = await observeStandaloneChargeRefund(held.db as never, {
    id: 'ch_held',
    amount: 1040,
    amount_refunded: 1040,
    currency: 'eur',
    payment_intent: 'pi_held',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  });
  assert.equal('duplicate' in observedAgain && observedAgain.duplicate, true);
  assert.equal(held.profile.totalEarnings, 880);
  assert.equal(payable(held.ledgers), 0);
});

test('a failed stripe refund does not claw earnings back', async () => {
  const state = books();
  let decisions: Record<string, unknown> | null = null;
  const prisma = {
    ...state.db,
    deliveryOrder: {
      findUnique: async () => ({
        ...state.order,
        orderId: null,
        deliveryProfile: { userId: 'courier' },
      }),
    },
    standaloneDeliveryRequest: {
      findFirst: async () => ({
        id: 'req_1',
        paymentStatus: 'PAID',
        stripeSessionId: 'cs_test',
        requesterUserId: 'buyer',
        buyerTotalCents: 1040,
        quotedFeeCents: 1000,
      }),
    },
    deliveryRefundDecision: {
      findUnique: async () => decisions,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        decisions = { id: 'dec_fail', ...data };
        return decisions;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        decisions = { ...decisions, ...data };
        return decisions;
      },
    },
    payout: { findFirst: async () => ({ providerRef: null, amountCents: 880 }) },
  };
  const stripe = {
    checkout: { sessions: { retrieve: async () => ({ payment_intent: 'pi_test', amount_total: 1040 }) } },
    refunds: { create: async () => { throw new Error('refund failed'); } },
    transfers: { createReversal: async () => ({ id: 'trr_unused' }) },
  };
  const result = await executeDeliveryRefundDecision(prisma as never, stripe as never, {
    deliveryOrderId: 'd1',
    adminUserId: 'admin',
    decision: 'APPROVE',
    reason: 'Kaart geweigerd bij terugbetaling',
    confirm: true,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.decision.stripeStatus, 'MANUAL');
    assert.equal(result.decision.stripeRefundId, null);
  }
  assert.equal(state.profile.totalEarnings, 880);
  assert.equal(state.refunds.length, 0);
  assert.equal(state.order.status, 'DELIVERED');
});
