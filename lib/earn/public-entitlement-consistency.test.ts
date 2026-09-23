/**
 * Public product copy must match the certified billing entitlements.
 * Affiliate capacity may differ; it must never be presented as the customer grant.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { earnHowItWorksEn, earnHowItWorksNl } from '@/lib/i18n/earnHowItWorksSources';
import {
  PUBLIC_GROWTH_AFFILIATE_CAPACITY_HC,
  PUBLIC_GROWTH_PLAN_ECONOMICS,
  PUBLIC_GROWTH_STARTER_CUSTOMER_ENTITLEMENT_HC,
  PUBLIC_GROWTH_STARTER_CUSTOMER_PRICE_EUR,
  PUBLIC_STUDIO_CREATOR_CUSTOMER_ENTITLEMENT_HC,
  PUBLIC_STUDIO_CREATOR_CUSTOMER_PRICE_EUR,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
} from '@/lib/earn/public-economics';

describe('public copy matches certified billing entitlements', () => {
  it('Growth Starter public price and HC are the certified €47 / 2500 contract', () => {
    assert.equal(PUBLIC_GROWTH_STARTER_CUSTOMER_PRICE_EUR, 47);
    assert.equal(PUBLIC_GROWTH_STARTER_CUSTOMER_ENTITLEMENT_HC, 2500);
    const eco = PUBLIC_GROWTH_PLAN_ECONOMICS.find((p) => p.key === 'starter')!;
    assert.equal(eco.customerPriceEur, PUBLIC_GROWTH_STARTER_CUSTOMER_PRICE_EUR);
    assert.equal(eco.customerEntitlementHc, PUBLIC_GROWTH_STARTER_CUSTOMER_ENTITLEMENT_HC);
    assert.equal(eco.includedHc, eco.customerEntitlementHc);
  });

  it('Studio Creator public price and HC are the certified €15 / 900 contract', () => {
    assert.equal(PUBLIC_STUDIO_CREATOR_CUSTOMER_PRICE_EUR, 15);
    assert.equal(PUBLIC_STUDIO_CREATOR_CUSTOMER_ENTITLEMENT_HC, 900);
    const eco = PUBLIC_STUDIO_PLAN_ECONOMICS.find((p) => p.key === 'creator')!;
    assert.equal(eco.priceEurGrossInclVat, PUBLIC_STUDIO_CREATOR_CUSTOMER_PRICE_EUR);
    assert.equal(eco.includedHc, PUBLIC_STUDIO_CREATOR_CUSTOMER_ENTITLEMENT_HC);
  });

  it('Growth Starter customer entitlement is not the 750 affiliate capacity', () => {
    const eco = PUBLIC_GROWTH_PLAN_ECONOMICS.find((p) => p.key === 'starter')!;
    assert.equal(PUBLIC_GROWTH_AFFILIATE_CAPACITY_HC.starter, 750);
    assert.equal(eco.affiliateCapacityHc, PUBLIC_GROWTH_AFFILIATE_CAPACITY_HC.starter);
    assert.notEqual(eco.customerEntitlementHc, eco.affiliateCapacityHc);
    assert.equal(eco.hcReserveEur, 7.5);
    assert.equal(eco.affiliateCommissionEur, 15.75);
  });

  it('rendered NL and EN cards say 2500 HC and €47, and do not say 750 HC included', () => {
    for (const copy of [earnHowItWorksNl, earnHowItWorksEn]) {
      const card = copy.growth.planCards.find((c) => c.key === 'starter')!;
      assert.match(card.includedCredits!, /2[.,]500/);
      assert.match(card.price, /47/);
      assert.doesNotMatch(card.includedCredits!, /750/);
      assert.match(copy.growth.basisBody, /2[.,]500/);
      assert.match(copy.growth.basisBody, /750/);
    }
  });
});
