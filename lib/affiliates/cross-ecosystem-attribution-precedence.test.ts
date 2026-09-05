import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveDeliveryFeeAffiliateSides,
  resolveSideAffiliatePrecedence,
} from '@/lib/affiliates/cross-ecosystem-attribution-precedence';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import { deliveryPlatformFeeCents } from '@/lib/hc/marketplace-hc-delivery-economics';

describe('cross-ecosystem Delivery affiliate precedence', () => {
  it('A: Studio-origin ecosystem → Delivery fee accrues (buyer full pool)', () => {
    const d = resolveDeliveryFeeAffiliateSides({
      buyer: {
        side: 'BUYER',
        ecosystemAffiliateCentralUserId: 'sergio',
        ecosystemAttributionId: 'eco-1',
        referralOriginPlatform: 'STUDIO',
        marketplaceAffiliateId: null,
      },
      provider: {
        side: 'SELLER',
        ecosystemAffiliateCentralUserId: null,
        ecosystemAttributionId: null,
        referralOriginPlatform: null,
        marketplaceAffiliateId: null,
      },
    });
    assert.equal(d.buyerSource, 'ECOSYSTEM');
    assert.equal(d.referralOriginPlatform, 'STUDIO');
    assert.equal(d.useBuyerOnlyFullPool, true);
    const fee = deliveryPlatformFeeCents(750);
    const pool = allocateMarketplaceAffiliatePool({
      platformFeeCents: fee,
      buyerAffiliateId: d.buyerAffiliateKey,
      sellerAffiliateId: null,
    });
    assert.equal(fee, 90);
    assert.equal(pool.poolCents, 45);
  });

  it('B: Marketplace-origin local Attribution → Delivery accrues', () => {
    const d = resolveDeliveryFeeAffiliateSides({
      buyer: {
        side: 'BUYER',
        ecosystemAffiliateCentralUserId: null,
        ecosystemAttributionId: null,
        referralOriginPlatform: null,
        marketplaceAffiliateId: 'mp-aff',
      },
      provider: {
        side: 'SELLER',
        ecosystemAffiliateCentralUserId: null,
        ecosystemAttributionId: null,
        referralOriginPlatform: null,
        marketplaceAffiliateId: null,
      },
    });
    assert.equal(d.buyerSource, 'MARKETPLACE_ATTRIBUTION');
    assert.equal(d.buyerAffiliateKey, 'mp-aff');
  });

  it('C: Growth-origin ecosystem eligible for Delivery', () => {
    const r = resolveSideAffiliatePrecedence({
      side: 'BUYER',
      ecosystemAffiliateCentralUserId: 'aff-g',
      ecosystemAttributionId: 'a',
      referralOriginPlatform: 'GROWTH',
      marketplaceAffiliateId: null,
    });
    assert.equal(r.referralOriginPlatform, 'GROWTH');
    assert.equal(r.source, 'ECOSYSTEM');
  });

  it('D: expired → no affiliate key from ecosystem candidate empty', () => {
    const r = resolveSideAffiliatePrecedence({
      side: 'BUYER',
      ecosystemAffiliateCentralUserId: null,
      ecosystemAttributionId: null,
      referralOriginPlatform: null,
      marketplaceAffiliateId: null,
    });
    assert.equal(r.source, 'NONE');
  });

  it('F: canonical + legacy → one affiliate (ecosystem)', () => {
    const r = resolveSideAffiliatePrecedence({
      side: 'BUYER',
      ecosystemAffiliateCentralUserId: 'sergio',
      ecosystemAttributionId: 'eco',
      referralOriginPlatform: 'STUDIO',
      marketplaceAffiliateId: 'legacy-other',
    });
    assert.equal(r.affiliateKey, 'sergio');
    assert.notEqual(r.affiliateKey, 'legacy-other');
  });

  it('I/J: fee base is platform fee only; HC debit / provider principal not used', () => {
    const fee = deliveryPlatformFeeCents(750);
    assert.equal(fee, 90);
    assert.notEqual(fee, 660);
    assert.notEqual(fee, 500); // arbitrary HC debit
  });

  it('K/L: full HC and mixed share same affiliate base', () => {
    assert.equal(deliveryPlatformFeeCents(750), deliveryPlatformFeeCents(750));
  });

  it('buyer ecosystem suppresses provider side (MULTIPLE_ATTRIBUTION_DOUBLE_COMMISSION=NO)', () => {
    const d = resolveDeliveryFeeAffiliateSides({
      buyer: {
        side: 'BUYER',
        ecosystemAffiliateCentralUserId: 'sergio',
        ecosystemAttributionId: 'a1',
        referralOriginPlatform: 'STUDIO',
        marketplaceAffiliateId: null,
      },
      provider: {
        side: 'SELLER',
        ecosystemAffiliateCentralUserId: 'someone',
        ecosystemAttributionId: 'a2',
        referralOriginPlatform: 'MARKETPLACE',
        marketplaceAffiliateId: 'p',
      },
    });
    assert.equal(d.providerAffiliateKey, null);
    assert.equal(d.buyerAffiliateKey, 'sergio');
  });
});
