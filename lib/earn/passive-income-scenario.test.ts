import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculatePlatformFeeCents } from '@/lib/fees';
import {
  growthV2AffiliateCommissionCents,
  PUBLIC_GROWTH_PLANS,
} from '@/lib/earn/public-economics';
import {
  CALCULATOR_INDIVIDUAL_FEE_PERCENT,
  growthPlanAffiliateCents,
  illustratedActiveCount,
  viewerOrderAffiliateCents,
  viewerOrderAffiliateForSale,
} from '@/lib/earn/passive-income-scenario';

describe('passive income scenario uses the marketplace pool', () => {
  it('single affiliate receives the whole pool, capped at 50% of the fee', () => {
    const row = viewerOrderAffiliateCents({ platformFeeCents: 180, scenario: 'single' });
    assert.equal(row.poolCents, 90);
    assert.equal(row.viewerCommissionCents, 90);
    assert.equal(row.otherCommissionCents, 0);
    assert.ok(row.viewerCommissionCents <= row.poolCents);
    assert.ok(row.poolCents <= Math.floor(180 / 2));
  });

  it('two different affiliates split the pool and do not exceed it', () => {
    const row = viewerOrderAffiliateCents({ platformFeeCents: 180, scenario: 'two' });
    assert.equal(row.poolCents, 90);
    assert.equal(row.viewerCommissionCents, 45);
    assert.equal(row.otherCommissionCents, 45);
    assert.equal(row.viewerCommissionCents + row.otherCommissionCents, row.poolCents);
  });

  it('no qualifying affiliate pays nothing while the pool is still capped', () => {
    const row = viewerOrderAffiliateCents({ platformFeeCents: 180, scenario: 'none' });
    assert.equal(row.poolCents, 90);
    assert.equal(row.viewerCommissionCents, 0);
    assert.equal(row.otherCommissionCents, 0);
  });

  it('odd-cent fee uses the allocator split, not a second rounding', () => {
    const fee = calculatePlatformFeeCents(1125, CALCULATOR_INDIVIDUAL_FEE_PERCENT);
    assert.equal(fee, 135);
    const row = viewerOrderAffiliateForSale({
      saleCents: 1125,
      feePercent: CALCULATOR_INDIVIDUAL_FEE_PERCENT,
      scenario: 'two',
    });
    assert.equal(row.platformFeeCents, 135);
    assert.equal(row.poolCents, 67);
    assert.equal(row.viewerCommissionCents, 34);
    assert.equal(row.otherCommissionCents, 33);
    assert.equal(row.viewerCommissionCents + row.otherCommissionCents, 67);
  });

  it('growth subscription uses affiliate capacity, not customer HC', () => {
    const starter = PUBLIC_GROWTH_PLANS.find((plan) => plan.key === 'starter')!;
    assert.notEqual(starter.affiliateCapacityHc, starter.customerEntitlementHc);
    const cents = growthPlanAffiliateCents('starter');
    const canonical = growthV2AffiliateCommissionCents(
      Math.round(starter.monthlyEurExVat * 100),
      starter.affiliateCapacityHc,
    ).affiliateCommissionCents;
    const wrongCustomerHc = growthV2AffiliateCommissionCents(
      Math.round(starter.monthlyEurExVat * 100),
      starter.customerEntitlementHc,
    ).affiliateCommissionCents;
    assert.equal(cents, canonical);
    assert.equal(cents, 1575);
    assert.notEqual(cents, wrongCustomerHc);
  });

  it('does not drop referred customers after month 12 in the illustration', () => {
    assert.equal(illustratedActiveCount(12, 2), 24);
    assert.equal(illustratedActiveCount(13, 2), 26);
    assert.equal(illustratedActiveCount(24, 2), 48);
    assert.equal(illustratedActiveCount(36, 2), 72);
  });
});
