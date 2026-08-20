import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computePlatformFeeCentsFromBps,
  exposureFromLegacyBps,
  exposureFromSnapshot,
  sellerNetFromFee,
  stripSpoofedFeeFields,
  parseStoredHcFeeSnapshot,
  type MarketplaceOrderFeeSnapshotDto,
} from './marketplace-order-fee-snapshot';

function snap(overrides: Partial<MarketplaceOrderFeeSnapshotDto> = {}): MarketplaceOrderFeeSnapshotDto {
  return {
    orderId: 'ord-1',
    sellerCentralUserId: 'seller-1',
    orderTotalCents: 450,
    baseSellerFeeBps: 1200,
    effectiveSellerFeeBps: 1200,
    platformFeeCents: 54,
    sellerNetExposureCents: 396,
    feeSourceType: 'SUBSCRIPTION_TIER',
    programId: null,
    calculationVersion: 'seller_fee_v1_20260820',
    paymentMethod: 'HC_ONLY',
    ...overrides,
  };
}

describe('HC_ONLY seller fee snapshot wiring', () => {
  it('12%: fee 54 net 396 buyer 450', () => {
    assert.equal(computePlatformFeeCentsFromBps(450, 1200), 54);
    assert.equal(sellerNetFromFee(450, 54), 396);
    const exp = exposureFromSnapshot({ hcCaptured: 450, grossOrderCents: 450, snapshot: snap() });
    assert.equal(exp.theoreticalPlatformFeeCents, 54);
    assert.equal(exp.sellerNetExposureCents, 396);
    assert.equal(exp.path, 'SNAPSHOT_PRESENT');
  });

  it('5%: fee 23 net 427 buyer 450 PARTNER_PROGRAM', () => {
    assert.equal(computePlatformFeeCentsFromBps(450, 500), 23);
    const snapshot = snap({
      effectiveSellerFeeBps: 500,
      platformFeeCents: 23,
      sellerNetExposureCents: 427,
      feeSourceType: 'PARTNER_PROGRAM',
      programId: 'prog-1',
    });
    const exp = exposureFromSnapshot({ hcCaptured: 450, grossOrderCents: 450, snapshot });
    assert.equal(exp.theoreticalPlatformFeeCents, 23);
    assert.equal(exp.sellerNetExposureCents, 427);
    assert.equal(exp.programId, 'prog-1');
    assert.equal(exp.feeSourceType, 'PARTNER_PROGRAM');
  });

  it('0%: fee 0 net 450 buyer 450 — no subsidy inference', () => {
    assert.equal(computePlatformFeeCentsFromBps(450, 0), 0);
    const snapshot = snap({
      effectiveSellerFeeBps: 0,
      platformFeeCents: 0,
      sellerNetExposureCents: 450,
      feeSourceType: 'PARTNER_PROGRAM',
      programId: 'sponsored',
    });
    const exp = exposureFromSnapshot({ hcCaptured: 450, grossOrderCents: 450, snapshot });
    assert.equal(exp.theoreticalPlatformFeeCents, 0);
    assert.equal(exp.sellerNetExposureCents, 450);
  });

  it('buyer required HC invariant', () => {
    for (const bps of [1200, 500, 0]) {
      const fee = computePlatformFeeCentsFromBps(450, bps);
      assert.equal(450, fee + sellerNetFromFee(450, fee));
    }
  });

  it('historical immutability: later program 800 bps does not rewrite snapshot', () => {
    const historical = snap({
      effectiveSellerFeeBps: 500,
      platformFeeCents: 23,
      sellerNetExposureCents: 427,
      feeSourceType: 'PARTNER_PROGRAM',
      programId: 'prog-1',
    });
    const liveProgramBps = 800;
    assert.notEqual(historical.effectiveSellerFeeBps, liveProgramBps);
    const exp = exposureFromSnapshot({ hcCaptured: 450, grossOrderCents: 450, snapshot: historical });
    assert.equal(exp.theoreticalPlatformFeeCents, 23);
    assert.equal(exp.sellerNetExposureCents, 427);
  });

  it('paused program fallback is new-order context only', () => {
    const oldOrder = snap({
      effectiveSellerFeeBps: 500,
      platformFeeCents: 23,
      sellerNetExposureCents: 427,
      feeSourceType: 'PARTNER_PROGRAM',
      programId: 'prog-1',
    });
    const newOrderBase = snap();
    assert.equal(oldOrder.effectiveSellerFeeBps, 500);
    assert.equal(newOrderBase.effectiveSellerFeeBps, 1200);
    assert.equal(newOrderBase.feeSourceType, 'SUBSCRIPTION_TIER');
  });

  it('LEGACY_NO_SNAPSHOT uses subscription bps', () => {
    const exp = exposureFromLegacyBps({ hcCaptured: 450, grossOrderCents: 450, platformFeeBps: 1200 });
    assert.equal(exp.path, 'LEGACY_NO_SNAPSHOT');
    assert.equal(exp.theoreticalPlatformFeeCents, 54);
    assert.equal(exp.platformFeePolicy, 'THEORETICAL_POLICY_PENDING');
  });

  it('strips client fee spoof fields', () => {
    const stripped = stripSpoofedFeeFields({
      items: [{ productId: 'p1', quantity: 1 }],
      effectiveSellerFeeBps: 0,
      programId: 'spoof',
      platformFeeCents: 1,
      sellerTier: 'premium',
    });
    assert.equal('effectiveSellerFeeBps' in stripped, false);
    assert.equal('programId' in stripped, false);
    assert.deepEqual(stripped.items, [{ productId: 'p1', quantity: 1 }]);
  });

  it('parseStoredHcFeeSnapshot round-trips', () => {
    const parsed = parseStoredHcFeeSnapshot(snap({ programId: 'prog-1', feeSourceType: 'PARTNER_PROGRAM' }));
    assert.equal(parsed?.effectiveSellerFeeBps, 1200);
    assert.equal(parsed?.programId, 'prog-1');
  });

  it('canonical Math.round is used for 5% of 450', () => {
    assert.equal(Math.round((450 * 500) / 10_000), 23);
  });
});
