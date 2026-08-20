import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateHcSellerPayoutEligibility,
  hcSellerPayoutIdempotencyKey,
  resolvePayableAmountCents,
  evaluateRefundAfterPayoutPolicy,
} from './eligibility';
import { createIsolatedHcSellerPayoutStore } from './isolated-payout-engine';
import type {
  HcSellerPayoutExposureView,
  HcSellerPayoutOrderView,
  HcSellerPayoutSellerView,
} from './types';

function baseExposure(overrides: Partial<HcSellerPayoutExposureView> = {}): HcSellerPayoutExposureView {
  return {
    id: 'exp-1',
    orderId: 'ord-1',
    sellerUserId: 'seller-1',
    buyerCentralUserId: 'buyer-1',
    status: 'EARNED',
    grossOrderCents: 450,
    theoreticalPlatformFeeCents: 23,
    sellerNetExposureCents: 427,
    payableAmountCents: null,
    settlementSource: 'HOMECHEFF_TREASURY',
    payoutReference: null,
    payoutIdempotencyKey: null,
    paidAt: null,
    calculationVersion: 'seller_fee_v1_20260820',
    feeSourceType: 'PARTNER_PROGRAM',
    effectiveSellerFeeBps: 500,
    ...overrides,
  };
}

function baseOrder(overrides: Partial<HcSellerPayoutOrderView> = {}): HcSellerPayoutOrderView {
  return {
    id: 'ord-1',
    status: 'DELIVERED',
    paymentMethod: 'HC_ONLY',
    hcPaymentPhase: 'SETTLEMENT_EARNED',
    hcCapturedHc: 450,
    stripeSessionId: null,
    sellerUserId: 'seller-1',
    ...overrides,
  };
}

function baseSeller(overrides: Partial<HcSellerPayoutSellerView> = {}): HcSellerPayoutSellerView {
  return {
    id: 'seller-1',
    stripeConnectAccountId: 'acct_sim_ready',
    stripeConnectOnboardingCompleted: true,
    ...overrides,
  };
}

function evalInput(
  exposure = baseExposure(),
  order = baseOrder(),
  seller = baseSeller(),
) {
  return evaluateHcSellerPayoutEligibility({
    exposure,
    order,
    seller,
    engineEnabled: true,
    productionMutationEnabled: true,
    isProductionDatabase: false,
  });
}

describe('HC seller payout eligibility', () => {
  it('427 exposure eligible when destination ready', () => {
    const r = evalInput();
    assert.equal(r.eligible, true);
    assert.equal(r.code, 'ELIGIBLE');
    assert.equal(r.payableAmountCents, 427);
    assert.equal(r.idempotencyKey, hcSellerPayoutIdempotencyKey('exp-1'));
  });

  it('missing destination blocked', () => {
    const r = evalInput(baseExposure(), baseOrder(), baseSeller({ stripeConnectAccountId: null }));
    assert.equal(r.eligible, false);
    assert.equal(r.code, 'PAYOUT_DESTINATION_NOT_READY');
  });

  it('wrong seller blocked', () => {
    const r = evalInput(baseExposure(), baseOrder({ sellerUserId: 'other' }), baseSeller());
    assert.equal(r.code, 'SELLER_MISMATCH');
  });

  it('wrong amount blocked when expected set', () => {
    const r = evaluateHcSellerPayoutEligibility({
      exposure: baseExposure(),
      order: baseOrder(),
      seller: baseSeller(),
      engineEnabled: true,
      productionMutationEnabled: true,
      isProductionDatabase: false,
      expectedAmountCents: 999,
    });
    assert.equal(r.code, 'PAYABLE_AMOUNT_INVALID');
  });

  it('refunded exposure blocked', () => {
    const r = evalInput(baseExposure({ status: 'REVERSED' }));
    assert.equal(r.code, 'ORDER_REFUNDED_OR_REVERSED');
  });

  it('already paid blocked', () => {
    const r = evalInput(baseExposure({ status: 'PAID', payoutReference: 'tr_x' }));
    assert.equal(r.code, 'EXPOSURE_ALREADY_PAID');
  });

  it('immutable 427 from sellerNetExposureCents', () => {
    assert.equal(resolvePayableAmountCents({ payableAmountCents: null, sellerNetExposureCents: 427 }), 427);
    const r = evalInput(baseExposure({ effectiveSellerFeeBps: 800, sellerNetExposureCents: 427 }));
    assert.equal(r.payableAmountCents, 427);
  });

  it('refund after payout returns POLICY_REQUIRED', () => {
    assert.equal(evaluateRefundAfterPayoutPolicy('PAID'), 'REFUND_AFTER_PAYOUT_POLICY_REQUIRED');
  });
});

describe('HC seller payout isolated engine', () => {
  it('EARNED → PAYOUT_PENDING → PAID with 427 transfer', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    const beforeHc = store.buyerWalletHc.get('buyer-sergio');
    const result = await store.executePayout(exposureId);
    assert.equal(result.ok, true);
    assert.equal(result.duplicate, false);
    assert.equal(store.adapter.transfers.length, 1);
    assert.equal(store.adapter.transfers[0]!.amountCents, 427);
    assert.equal(store.exposures.get(exposureId)!.status, 'PAID');
    assert.equal(store.buyerWalletHc.get('buyer-sergio'), beforeHc);
  });

  it('duplicate replay does not pay twice', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    await store.executePayout(exposureId);
    const replay = await store.executePayout(exposureId);
    assert.equal(replay.ok, true);
    assert.equal(replay.duplicate, true);
    assert.equal(store.adapter.transfers.length, 1);
  });

  it('transfer failure not PAID', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    store.adapter.failNext('STRIPE_INSUFFICIENT_FUNDS', true);
    const result = await store.executePayout(exposureId);
    assert.equal(result.ok, false);
    assert.equal(store.exposures.get(exposureId)!.status, 'PAYOUT_FAILED_RETRYABLE');
    assert.equal(store.adapter.transfers.length, 0);
  });

  it('retry after failure succeeds once', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    store.adapter.failNext('STRIPE_INSUFFICIENT_FUNDS', true);
    await store.executePayout(exposureId);
    const retry = await store.executePayout(exposureId);
    assert.equal(retry.ok, true);
    assert.equal(store.adapter.transfers.length, 1);
  });

  it('missing destination blocked before transfer', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    store.sellers.get('seller-keksi')!.stripeConnectAccountId = null;
    const result = await store.executePayout(exposureId);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'PAYOUT_DESTINATION_NOT_READY');
    assert.equal(store.adapter.transfers.length, 0);
  });

  it('concurrent-style double execute still one transfer (sequential idempotency)', async () => {
    const store = createIsolatedHcSellerPayoutStore();
    const { exposureId } = store.seedCertifiedExposure427();
    const [a, b] = await Promise.all([store.executePayout(exposureId), store.executePayout(exposureId)]);
    const successes = [a, b].filter((r) => r.ok && !r.duplicate).length;
    const duplicates = [a, b].filter((r) => r.ok && r.duplicate).length;
    assert.ok(successes + duplicates >= 1);
    assert.equal(store.adapter.transfers.length, 1);
  });
});

describe('HC seller payout treasury source', () => {
  it('idempotency key is exposure-scoped v1', () => {
    assert.equal(hcSellerPayoutIdempotencyKey('abc'), 'marketplace:hc:payout:abc:v1');
  });
});
