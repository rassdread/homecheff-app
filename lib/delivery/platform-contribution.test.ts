import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { platformContribution } from './platform-contribution';
import { describeMapsKeyPlacement, serverDistanceMatrixKey } from './maps-key-placement';

describe('certified delivery contribution', () => {
  it('matches the affiliate marketplace charge without taking the courier share', () => {
    const surcharge = calculateStripeFeeForBuyer(500 + 955);
    assert.equal(surcharge.buyerTotalCents, 1502);
    assert.equal(surcharge.stripeFeeCents, 47);
    const result = platformContribution({
      grossCents: 1502,
      productCents: 500,
      deliveryFeeCents: 955,
      buyerSurchargeCents: 47,
      sellerTransferCents: 440,
      courierTransferCents: 840,
      platformProductFeeCents: 60,
      platformDeliveryShareCents: 115,
      affiliateProductCommissionCents: 30,
      affiliateDeliveryCommissionCents: 57,
      stripeFeeCents: 72,
      stripeFeeFinal: false,
    });
    assert.equal(result.transfersCents, 1280);
    assert.equal(result.affiliateLiabilityCents, 87);
    assert.equal(result.platformRetainedBeforeStripeFeeCents, 222);
    assert.equal(result.netAfterKnownCostsCents, 63);
    assert.equal(result.stripeFeeFinal, false);
    assert.equal(result.courierShareReducedByAffiliate, false);
    assert.equal(result.sellerShareReducedByAffiliate, false);
  });

  it('matches the standalone charge and leaves affiliate liability unpaid', () => {
    const surcharge = calculateStripeFeeForBuyer(955);
    assert.equal(surcharge.buyerTotalCents, 994);
    assert.equal(surcharge.stripeFeeCents, 39);
    const result = platformContribution({
      grossCents: 994,
      productCents: 0,
      deliveryFeeCents: 955,
      buyerSurchargeCents: 39,
      sellerTransferCents: 0,
      courierTransferCents: 840,
      platformProductFeeCents: 0,
      platformDeliveryShareCents: 115,
      affiliateProductCommissionCents: 0,
      affiliateDeliveryCommissionCents: 57,
      stripeFeeCents: 56,
      stripeFeeFinal: false,
    });
    assert.equal(result.transfersCents, 840);
    assert.equal(result.platformRetainedBeforeStripeFeeCents, 154);
    assert.equal(result.netAfterKnownCostsCents, 41);
    assert.equal(result.courierShareReducedByAffiliate, false);
  });
});

describe('distance matrix key placement', () => {
  it('reads only the server key and does not treat an IP allowlist as Vercel-safe', () => {
    const env: NodeJS.ProcessEnv = { NODE_ENV: 'test' };
    env.GOOGLE_MAPS_API_KEY = 'server-key';
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'browser-key';
    assert.equal(serverDistanceMatrixKey(env), 'server-key');
    const placement = describeMapsKeyPlacement(env);
    assert.equal(placement.source, 'server');
    assert.equal(placement.browserKeyUsedForDistance, false);
    assert.equal(placement.ipAllowlistFitsVercel, false);
    const empty: NodeJS.ProcessEnv = { NODE_ENV: 'test' };
    assert.equal(describeMapsKeyPlacement(empty).source, 'missing');
  });
});
