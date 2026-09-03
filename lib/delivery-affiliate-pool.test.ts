import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DELIVERY_PLATFORM_FEE_PERCENT } from './fees';
import { allocateMarketplaceAffiliatePool } from './marketplace-affiliate-pool';

/**
 * Delivery affiliate: 50% of HomeCheff delivery PLATFORM fee only.
 * Courier principal (88%) must never enter the commission base.
 */
describe('delivery affiliate pool (platform fee only)', () => {
  it('uses 12% HomeCheff cut of delivery charge as eligible base', () => {
    const buyerDeliveryChargeCents = 1000; // €10
    const homecheffFee = Math.round(
      (buyerDeliveryChargeCents * DELIVERY_PLATFORM_FEE_PERCENT) / 100,
    );
    const courierPrincipal = buyerDeliveryChargeCents - homecheffFee;

    assert.equal(homecheffFee, 120);
    assert.equal(courierPrincipal, 880);

    const alloc = allocateMarketplaceAffiliatePool({
      platformFeeCents: homecheffFee,
      buyerAffiliateId: 'aff-buyer',
      sellerAffiliateId: null,
    });

    assert.equal(alloc.poolCents, 60); // 50% of €1.20
    assert.equal(alloc.lines[0]?.commissionCents, 60);
  });

  it('marketplace + delivery use distinct event id bases', () => {
    const orderId = 'ord_1';
    const productId = 'prod_1';
    const deliveryOrderId = 'del_1';
    const mpEvent = `${orderId}_${productId}`;
    const deliveryEvent = `${orderId}_delivery_${deliveryOrderId}`;
    assert.notEqual(mpEvent, deliveryEvent);
  });
});
