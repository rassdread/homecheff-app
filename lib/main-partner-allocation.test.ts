/**
 * MAIN10_SUB40 — mirrors Growth canonical allocator for Marketplace tests.
 * Source of truth for business % remains lib/affiliate-config.ts.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_MAX_DISCOUNT_PCT,
  MAIN_AFFILIATE_MAX_DISCOUNT_PCT,
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
  DISCOUNT_APPLIES_TO,
} from './affiliate-config';

describe('original HomeCheff MAIN10_SUB40 (affiliate-config)', () => {
  it('business: direct 50%, partner 40%, main 10%', () => {
    assert.equal(AFFILIATE_BUSINESS_COMMISSION_PCT, 0.5);
    assert.equal(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT, 0.4);
    assert.equal(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT, 0.1);
    const fee = 10_000;
    const direct = calculateBusinessSubscriptionCommission(fee, 0, false);
    assert.equal(direct.affiliateCommissionCents, 5_000);
    assert.equal(direct.homecheffShareCents, 5_000);
    const sub = calculateBusinessSubscriptionCommission(fee, 0, true);
    assert.equal(sub.affiliateCommissionCents, 4_000);
    assert.equal(calculateParentAffiliateBusinessCommission(fee), 1_000);
  });

  it('partner max discount 75% of 40% share = 30% of price; funded from partner commission', () => {
    assert.equal(SUB_AFFILIATE_MAX_DISCOUNT_PCT, 75);
    assert.equal(MAIN_AFFILIATE_MAX_DISCOUNT_PCT, 80);
    assert.equal(DISCOUNT_APPLIES_TO, 'SUBSCRIPTION_ONLY');
    const fee = 10_000;
    const atMax = calculateBusinessSubscriptionCommission(fee, 75, true);
    assert.equal(atMax.discountCents, 3_000); // 30% of price
    assert.equal(atMax.finalAffiliateCommissionCents, 1_000);
    assert.equal(atMax.homecheffShareCents, 5_000); // HC 50% of base not reduced
    assert.equal(calculateParentAffiliateBusinessCommission(fee), 1_000); // main not reduced
  });

  it('80/20 of 50% pool line equals MAIN10_SUB40 of fee', () => {
    const fee = 10_000;
    const pool = Math.floor(fee * 0.5);
    const mainOfLine = Math.floor(pool * (PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT / AFFILIATE_BUSINESS_COMMISSION_PCT));
    const partnerOfLine = pool - mainOfLine;
    assert.equal(partnerOfLine, 4_000);
    assert.equal(mainOfLine, 1_000);
  });
});
