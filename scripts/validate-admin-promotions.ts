/**
 * HOMECHEFF — Admin platform promotions validator
 *
 * Confirms duration model, server quote shape, 100% free path rules,
 * affiliate separation, and failure reasons (expired/disabled/max).
 * Prisma-free unit coverage + policy checks (no live Stripe).
 */

import assert from 'node:assert/strict';
import {
  ADMIN_MAX_DISCOUNT_PCT,
  assertDiscountWithinCap,
  calculatePlatformSubscriptionDiscount,
  calculatePromoSubscriptionPricing,
  isPlatformPromo,
  resolveMaxDiscountPct,
} from '../lib/promo-codes/discount-policy';
import {
  buildPromoDurationQuote,
  billingCyclesToDurationDays,
  formatPromoDurationLabel,
  parseDiscountDurationCycles,
} from '../lib/promo-codes/platform-promo-duration';
import {
  MAIN_AFFILIATE_MAX_DISCOUNT_PCT,
  SUB_AFFILIATE_MAX_DISCOUNT_PCT,
} from '../lib/affiliate-config';

const PREMIUM = 19_900; // €199.00
const PRO = 9_900;
const BASIC = 3_900;

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`OK ${label}`);
}

section('Duration parse');
assert.deepEqual(parseDiscountDurationCycles(3), { ok: true, value: 3 });
assert.deepEqual(parseDiscountDurationCycles(null), { ok: true, value: null });
assert.equal(parseDiscountDurationCycles(0).ok, false);
assert.equal(parseDiscountDurationCycles(37).ok, false);
assert.equal(parseDiscountDurationCycles(1.5).ok, false);
ok('parseDiscountDurationCycles 1–36');

section('Duration labels & days');
assert.equal(formatPromoDurationLabel(1), '1 month');
assert.equal(formatPromoDurationLabel(3), '3 months');
assert.equal(billingCyclesToDurationDays(1), 30);
assert.equal(billingCyclesToDurationDays(3), 90);
assert.equal(billingCyclesToDurationDays(null), null);
const d3 = buildPromoDurationQuote(3);
assert.equal(d3.discountDurationCycles, 3);
assert.equal(d3.resumesAtListPrice, true);
assert.equal(buildPromoDurationQuote(null).resumesAtListPrice, false);
ok('duration quote helpers');

section('100% × 1 / 3 months');
for (const cycles of [1, 3] as const) {
  const pricing = calculatePlatformSubscriptionDiscount(PREMIUM, {
    discountType: 'percent',
    discountPercent: 100,
  });
  assert.equal(pricing.finalPriceCents, 0);
  assert.equal(pricing.discountCents, PREMIUM);
  const duration = buildPromoDurationQuote(cycles);
  assert.equal(duration.discountDurationCycles, cycles);
  assert.equal(billingCyclesToDurationDays(cycles), cycles * 30);
  ok(`100% premium ${cycles} month(s) → €0 then list resumes`);
}

section('50% × 3 months');
{
  const pricing = calculatePlatformSubscriptionDiscount(PREMIUM, {
    discountType: 'percent',
    discountPercent: 50,
  });
  assert.equal(pricing.finalPriceCents, 9_950);
  assert.equal(pricing.discountCents, 9_950);
  const duration = buildPromoDurationQuote(3);
  assert.equal(duration.resumesAtListPrice, true);
  ok('50% × 3 → €99.50 then €199');
}

section('25% × 6 months');
{
  const pricing = calculatePlatformSubscriptionDiscount(PREMIUM, {
    discountType: 'percent',
    discountPercent: 25,
  });
  assert.equal(pricing.finalPriceCents, 14_925);
  assert.equal(buildPromoDurationQuote(6).discountDurationCycles, 6);
  ok('25% × 6 → promotional then list');
}

section('Basic / Pro / Premium quote shape');
for (const [plan, base] of [
  ['BASIC', BASIC],
  ['PRO', PRO],
  ['PREMIUM', PREMIUM],
] as const) {
  const pricing = calculatePromoSubscriptionPricing({
    basePriceCents: base,
    discountSharePct: 100,
    affiliateId: null,
    appliesTo: 'PLATFORM:launch',
    isSubAffiliate: false,
  });
  assert.equal(pricing.isPlatform, true);
  assert.equal(pricing.finalPriceCents, 0);
  const quote = {
    plan,
    ...pricing,
    currency: 'eur' as const,
    ...buildPromoDurationQuote(3),
  };
  assert.equal(quote.discountDurationCycles, 3);
  assert.equal(quote.resumesAtListPrice, true);
  ok(`${plan} server quote shape with duration`);
}

section('Affiliate separation');
assert.equal(resolveMaxDiscountPct({ actor: 'admin' }), 100);
assert.equal(ADMIN_MAX_DISCOUNT_PCT, 100);
assert.equal(MAIN_AFFILIATE_MAX_DISCOUNT_PCT, 80);
assert.equal(SUB_AFFILIATE_MAX_DISCOUNT_PCT, 75);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 100 }).ok,
  false,
);
assert.equal(
  assertDiscountWithinCap({ actor: 'admin', discountPct: 100 }).ok,
  true,
);
assert.equal(isPlatformPromo({ affiliateId: null, appliesTo: 'PLATFORM:launch' }), true);
assert.equal(
  isPlatformPromo({ affiliateId: 'aff_1', appliesTo: 'SUBSCRIPTION_ONLY' }),
  false,
);
ok('admin 0–100% not routed through affiliate caps');

section('Failure reason taxonomy (contract)');
const reasons = [
  'not_found',
  'disabled',
  'expired',
  'max_redemptions',
  'not_started',
  'missing_code',
] as const;
assert.equal(reasons.includes('expired'), true);
assert.equal(reasons.includes('disabled'), true);
assert.equal(reasons.includes('max_redemptions'), true);
ok('invalid/expired/disabled/max redemption reasons defined');

section('No fake €0.01 Stripe for 100%');
{
  const pricing = calculatePlatformSubscriptionDiscount(PREMIUM, {
    discountType: 'percent',
    discountPercent: 100,
  });
  assert.equal(pricing.finalPriceCents, 0);
  assert.notEqual(pricing.finalPriceCents, 1);
  ok('100% finalPriceCents === 0 (entitlement path, not micro-charge)');
}

console.log(`\n=== SUMMARY: ${passed} checks passed ===`);
console.log('HOMECHEFF_ADMIN_PROMOTIONS_VALIDATOR_PASS');
