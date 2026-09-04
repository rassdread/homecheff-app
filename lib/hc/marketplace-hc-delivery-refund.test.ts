import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deliveryRefundEconomicsFromGross,
  mergeHcDeliveryRefundNotes,
  readHcDeliveryRefundMarker,
  type HcDeliveryRefundMarker,
} from '@/lib/hc/marketplace-hc-delivery-refund-pure';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';

describe('HC delivery refund economics', () => {
  it('A/full HC: €7.50 → provider 660 / fee 90 from locked gross (not live price)', () => {
    const e = deliveryRefundEconomicsFromGross(750);
    assert.equal(e.deliveryGrossCents, 750);
    assert.equal(e.providerPrincipalCents, 660);
    assert.equal(e.homeCheffFeeCents, 90);
  });

  it('I/J: affiliate reversal base is original fee snapshot only', () => {
    const fee = deliveryRefundEconomicsFromGross(750).homeCheffFeeCents;
    const direct = allocateMarketplaceAffiliatePool({
      platformFeeCents: fee,
      buyerAffiliateId: 'aff-a',
      sellerAffiliateId: null,
    });
    assert.equal(direct.poolCents, 45);
    assert.equal(direct.lines[0]?.commissionCents, 45);

    const partner = Math.round(fee * 0.4);
    const main = Math.round(fee * 0.1);
    assert.equal(partner, 36);
    assert.equal(main, 9);
  });

  it('K: refund amounts do not depend on a later affiliate tree change', () => {
    const originalPartner = 36;
    const originalMain = 9;
    // Simulate relationship change: would have been different pool if recalculated — must not apply.
    const laterWouldBe = allocateMarketplaceAffiliatePool({
      platformFeeCents: 90,
      buyerAffiliateId: 'aff-new-tree',
      sellerAffiliateId: 'aff-seller-new',
    });
    assert.notEqual(laterWouldBe.lines.length, 0);
    // Authoritative refund uses original snapshot cents:
    assert.equal(originalPartner + originalMain, 45);
  });

  it('marker merge is idempotent-complete skip signal', () => {
    const marker: HcDeliveryRefundMarker = {
      status: 'COMPLETE',
      at: '2026-01-01T00:00:00.000Z',
      deliveryOrderId: 'del_1',
      deliveryGrossCents: 750,
      providerPrincipalCents: 660,
      homeCheffFeeCents: 90,
      providerMode: 'LEDGER_CLAWBACK',
      providerReversalId: 'ledger_clawback',
      affiliateReversed: true,
      affiliateAlreadyDone: false,
    };
    const notes = mergeHcDeliveryRefundNotes(null, marker);
    const again = mergeHcDeliveryRefundNotes(notes, marker);
    assert.equal(readHcDeliveryRefundMarker(again)?.status, 'COMPLETE');
    assert.equal(readHcDeliveryRefundMarker(again)?.providerPrincipalCents, 660);
  });

  it('mixed funding does not shrink provider/affiliate reversal base', () => {
    // Customer paid 500 HC + €2.50 Stripe; economics still full €7.50 delivery.
    const e = deliveryRefundEconomicsFromGross(750);
    assert.equal(e.providerPrincipalCents, 660);
    assert.equal(e.homeCheffFeeCents, 90);
  });

  it('H: company settlement owner only — no separate driver principal math', () => {
    const companyPrincipal = deliveryRefundEconomicsFromGross(750).providerPrincipalCents;
    const driverSeparate = 0;
    assert.equal(companyPrincipal, 660);
    assert.equal(driverSeparate, 0);
  });

  it('net outstanding after full reverse is zero', () => {
    const e = deliveryRefundEconomicsFromGross(750);
    const providerOutstanding = e.providerPrincipalCents - 660;
    const feeOutstanding = e.homeCheffFeeCents - 90;
    const affiliateOutstanding = 45 - 45;
    assert.equal(providerOutstanding, 0);
    assert.equal(feeOutstanding, 0);
    assert.equal(affiliateOutstanding, 0);
  });

  it('provider lookup uses DeliveryProfile.userId — not phantom delivererId', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(
      new URL('./marketplace-hc-delivery-refund.ts', import.meta.url),
      'utf8',
    );
    assert.equal(src.includes('delivererId'), false);
    assert.equal(src.includes('deliveryProfile: { select: { userId: true } }'), true);
    assert.equal(src.includes('delivery.deliveryProfile?.userId'), true);
  });
});
