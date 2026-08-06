/**
 * HOMECHEFF — Admin promocode regression validator
 *
 * Confirms:
 * - Admin platform pricing: 0, 10, 25, 40, 50, 75, 90, 100% of full price
 * - Affiliate max caps unchanged (main 80%, sub 75% of commission share)
 * - Affiliate effective ~40% price ceiling for main at max share discount
 * - assertDiscountWithinCap rejects affiliate over-cap, allows admin 100%
 */

import assert from 'node:assert/strict';
import {
  ADMIN_MAX_DISCOUNT_PCT,
  assertDiscountWithinCap,
  calculatePlatformSubscriptionDiscount,
  calculatePromoSubscriptionPricing,
  resolveMaxDiscountPct,
} from '../lib/promo-codes/discount-policy';
import {
  MAIN_AFFILIATE_MAX_DISCOUNT_PCT,
  SUB_AFFILIATE_MAX_DISCOUNT_PCT,
  calculateSubscriptionPrice,
} from '../lib/affiliate-config';

const BASE = 10_000; // €100.00

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

section('Role caps');
assert.equal(resolveMaxDiscountPct({ actor: 'admin' }), 100);
assert.equal(resolveMaxDiscountPct({ actor: 'affiliate', isSubAffiliate: false }), MAIN_AFFILIATE_MAX_DISCOUNT_PCT);
assert.equal(resolveMaxDiscountPct({ actor: 'affiliate', isSubAffiliate: true }), SUB_AFFILIATE_MAX_DISCOUNT_PCT);
assert.equal(MAIN_AFFILIATE_MAX_DISCOUNT_PCT, 80);
assert.equal(SUB_AFFILIATE_MAX_DISCOUNT_PCT, 75);
assert.equal(ADMIN_MAX_DISCOUNT_PCT, 100);
console.log('OK caps unchanged for affiliates; admin=100');

section('assertDiscountWithinCap');
for (const pct of [0, 10, 25, 40, 50, 75, 90, 100]) {
  const r = assertDiscountWithinCap({ actor: 'admin', discountPct: pct });
  assert.equal(r.ok, true, `admin ${pct}% should pass`);
}
const affiliateOver = assertDiscountWithinCap({
  actor: 'affiliate',
  discountPct: 100,
  isSubAffiliate: false,
});
assert.equal(affiliateOver.ok, false);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 80, isSubAffiliate: false }).ok,
  true,
);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 81, isSubAffiliate: false }).ok,
  false,
);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 75, isSubAffiliate: true }).ok,
  true,
);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 76, isSubAffiliate: true }).ok,
  false,
);
console.log('OK admin 0–100 allowed; affiliate over-cap rejected');

section('Admin platform percent of full price');
for (const pct of [0, 10, 25, 40, 50, 75, 90, 100]) {
  const r = calculatePlatformSubscriptionDiscount(BASE, {
    discountType: 'percent',
    discountPercent: pct,
  });
  assert.equal(r.discountCents, Math.round(BASE * (pct / 100)));
  assert.equal(r.finalPriceCents, BASE - r.discountCents);
  const viaPromo = calculatePromoSubscriptionPricing({
    basePriceCents: BASE,
    discountSharePct: pct,
    affiliateId: null,
    appliesTo: 'PLATFORM:testing',
  });
  assert.equal(viaPromo.isPlatform, true);
  assert.equal(viaPromo.finalPriceCents, r.finalPriceCents);
  console.log(`  ${pct}% → discount ${r.discountCents}c final ${r.finalPriceCents}c`);
}

section('Admin platform fixed amount');
const fixed = calculatePlatformSubscriptionDiscount(BASE, {
  discountType: 'fixed',
  discountCents: 2500,
});
assert.equal(fixed.discountCents, 2500);
assert.equal(fixed.finalPriceCents, 7500);
const fixedOver = calculatePlatformSubscriptionDiscount(BASE, {
  discountType: 'fixed',
  discountCents: 99_999,
});
assert.equal(fixedOver.finalPriceCents, 0);
console.log('OK fixed amount + clamp to base');

section('Affiliate behaviour must not regress');
const mainMax = calculateSubscriptionPrice(BASE, MAIN_AFFILIATE_MAX_DISCOUNT_PCT, false);
// 80% of 50% commission = 40% of price
assert.equal(mainMax.discountCents, 4000);
assert.equal(mainMax.finalPriceCents, 6000);

const affiliateViaPromo = calculatePromoSubscriptionPricing({
  basePriceCents: BASE,
  discountSharePct: 100,
  affiliateId: 'aff_1',
  appliesTo: 'SUBSCRIPTION_ONLY',
  isSubAffiliate: false,
});
// Commission-share path still applies min-commission floor → max ~40% of price
assert.equal(affiliateViaPromo.isPlatform, false);
assert.equal(affiliateViaPromo.discountCents, mainMax.discountCents);
assert.equal(affiliateViaPromo.finalPriceCents, 6000);

const subMax = calculateSubscriptionPrice(BASE, SUB_AFFILIATE_MAX_DISCOUNT_PCT, true);
// 75% of 40% commission = 30% of price
assert.equal(subMax.discountCents, 3000);
console.log('OK affiliate max effective discounts unchanged (main ~40%, sub ~30%)');

console.log('\nHOMECHEFF_ADMIN_PROMOCODE_REGRESSION_FIXED');
console.log('PASS');
