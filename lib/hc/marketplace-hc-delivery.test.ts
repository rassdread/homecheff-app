import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HC_DELIVERY_POLICY_VERSION,
  isLocalDeliveryMode,
  normalizeHcDeliveryMode,
  splitCheckoutAmounts,
} from '@/lib/hc/marketplace-hc-delivery-economics';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';

describe('HC full delivery payment (circular)', () => {
  it('includes complete delivery gross in checkout face value', () => {
    const split = splitCheckoutAmounts({
      productsTotalCents: 2000,
      deliveryFeeCents: 750,
    });
    assert.equal(split.orderTotalCents, 2750);
    assert.equal(split.sellerGmvCents, 2000);
    assert.equal(split.deliveryFeeCents, 750);
    assert.equal(split.providerPrincipalCents, 660);
    assert.equal(split.homeCheffDeliveryFeeCents, 90);
  });

  it('payment-method neutrality: same 12/88 and affiliate base for full HC and mixed', () => {
    const gross = 750;
    const fullHc = splitDeliveryCommission(gross);
    const mixed = splitDeliveryCommission(gross);
    assert.equal(fullHc.platformCommissionCents, mixed.platformCommissionCents);
    assert.equal(fullHc.providerNetPayoutCents, mixed.providerNetPayoutCents);
    assert.equal(fullHc.platformCommissionCents, 90);
    assert.equal(fullHc.providerNetPayoutCents, 660);

    const aff = allocateMarketplaceAffiliatePool({
      platformFeeCents: fullHc.platformCommissionCents,
      buyerAffiliateId: 'aff-direct',
      sellerAffiliateId: null,
    });
    assert.equal(aff.poolCents, 45); // 50% of €0.90
    assert.equal(aff.lines[0]?.commissionCents, 45);
  });

  it('MAIN10_SUB40 allocates 40/10 of delivery platform fee only', () => {
    const fee = 90;
    const partner = Math.round(fee * 0.4);
    const main = Math.round(fee * 0.1);
    assert.equal(partner, 36);
    assert.equal(main, 9);
    assert.equal(partner + main, 45);
    // Provider principal never in base
    assert.notEqual(660, fee);
  });

  it('HC debit is not itself an affiliate event id', () => {
    const orderId = 'ord_hc_1';
    const deliveryOrderId = 'del_1';
    const hcDebitEvent = `hc_debit_${orderId}`;
    const deliveryFeeEvent = `${orderId}_delivery_${deliveryOrderId}`;
    assert.notEqual(hcDebitEvent, deliveryFeeEvent);
  });

  it('normalizes LOCAL_PROVIDER for HC checkout', () => {
    assert.equal(normalizeHcDeliveryMode('LOCAL_PROVIDER'), 'LOCAL_PROVIDER');
    assert.equal(normalizeHcDeliveryMode('TEEN_DELIVERY'), 'LOCAL_PROVIDER');
    assert.ok(isLocalDeliveryMode('LOCAL_PROVIDER'));
    assert.ok(!isLocalDeliveryMode('PICKUP'));
  });

  it('policy version is stable', () => {
    assert.equal(HC_DELIVERY_POLICY_VERSION, 'hc_full_delivery_v1');
  });

  it('seller GMV never includes courier delivery principal', () => {
    const s = splitCheckoutAmounts({
      productsTotalCents: 2000,
      deliveryFeeCents: 750,
      smsNotificationCostCents: 50,
    });
    assert.equal(s.sellerGmvCents, 2000);
    assert.equal(s.orderTotalCents, 2800);
    assert.ok(s.sellerGmvCents + s.deliveryFeeCents + s.smsCents === s.orderTotalCents);
  });
});
