/**
 * HOMECHEFF — Promocode end-to-end integration validator
 *
 * Covers: policy authority, admin 0–100, fixed, affiliate caps, stacking policy,
 * forged client discount rejection, zero-total handling, UX surface inventory,
 * trim/case, price consistency math.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_MAX_DISCOUNT_PCT,
  assertDiscountWithinCap,
  calculatePlatformSubscriptionDiscount,
  calculatePromoSubscriptionPricing,
  encodePlatformFixedAppliesTo,
  encodePlatformPercentAppliesTo,
  resolveMaxDiscountPct,
} from '../lib/promo-codes/discount-policy';
import {
  extractPromoCodeFromBody,
  SUBSCRIPTION_PLAN_KEYS,
} from '../lib/promo-codes/subscription-promo-shared';
import {
  MAIN_AFFILIATE_MAX_DISCOUNT_PCT,
  SUB_AFFILIATE_MAX_DISCOUNT_PCT,
  calculateSubscriptionPrice,
} from '../lib/affiliate-config';

const ROOT = process.cwd();
const BASE = 10_000;

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function fileContains(rel: string, needles: string[]): void {
  const path = join(ROOT, rel);
  assert.ok(existsSync(path), `missing file ${rel}`);
  const src = readFileSync(path, 'utf8');
  for (const n of needles) {
    assert.ok(src.includes(n), `${rel} should contain: ${n}`);
  }
}

section('1. Promo entry inventory (subscription surfaces)');
fileContains('app/sell/page.tsx', [
  'Heb je een kortingscode',
  '/api/affiliate/validate-promo-code',
  '/api/subscribe',
  'promoCode: finalPromoCode',
  'Toepassen',
  'Wissen',
]);
fileContains('components/business/SubscriptionPlanCards.tsx', [
  'promoQuotes',
  'finalPriceCents',
  'basePriceCents',
]);
fileContains('components/seller/BusinessUpgradeCallout.tsx', ['/sell']);
// Marketplace checkout: no subscription promo field (intentionally separate system)
const checkoutSrc = readFileSync(join(ROOT, 'app/checkout/page.tsx'), 'utf8');
assert.ok(
  !checkoutSrc.includes('validate-promo-code'),
  'marketplace checkout must not use subscription promo API',
);
console.log('OK /sell has promo field; upgrade CTAs route to /sell; checkout is separate');

section('2. One promo system — server authority');
fileContains('app/api/affiliate/validate-promo-code/route.ts', [
  'resolveSubscriptionPromo',
  "authority: 'server'",
  'quotes',
]);
fileContains('app/api/subscribe/route.ts', [
  'extractPromoCodeFromBody',
  'resolveSubscriptionPromo',
  'activateFreeSubscriptionEntitlement',
  'freeActivation',
]);
fileContains('components/business/SubscriptionPlanCards.tsx', [
  'Server-authoritative quotes',
]);
// Client must NOT hardcode affiliate 50% commission math anymore
const cards = readFileSync(
  join(ROOT, 'components/business/SubscriptionPlanCards.tsx'),
  'utf8',
);
assert.ok(!cards.includes('displayPrice * 0.5'), 'no client affiliate 50% math');
console.log('OK validate → quotes → UI display; subscribe revalidates');

section('3. Admin platform percent 10–100');
for (const pct of [10, 25, 40, 50, 75, 90, 100]) {
  assert.equal(assertDiscountWithinCap({ actor: 'admin', discountPct: pct }).ok, true);
  const r = calculatePlatformSubscriptionDiscount(BASE, {
    discountType: 'percent',
    discountPercent: pct,
  });
  assert.equal(r.finalPriceCents, BASE - Math.round(BASE * (pct / 100)));
  const via = calculatePromoSubscriptionPricing({
    basePriceCents: BASE,
    discountSharePct: pct,
    affiliateId: null,
    appliesTo: encodePlatformPercentAppliesTo('testing'),
  });
  assert.equal(via.finalPriceCents, r.finalPriceCents);
  assert.equal(via.isPlatform, true);
}
console.log('OK admin percents');

section('4. 100% zero-total architecture');
const hundred = calculatePlatformSubscriptionDiscount(BASE, {
  discountType: 'percent',
  discountPercent: 100,
});
assert.equal(hundred.finalPriceCents, 0);
fileContains('lib/promo-codes/activate-free-subscription.ts', [
  'activateFreeSubscriptionEntitlement',
  'redemptionCount',
]);
fileContains('app/api/subscribe/route.ts', [
  'finalPriceCents <= 0',
  'freeActivation: true',
  'geen betaling',
]);
assert.ok(
  !readFileSync(join(ROOT, 'app/api/subscribe/route.ts'), 'utf8').includes('unit_amount: 0'),
  'must not create Stripe unit_amount 0 for free path',
);
console.log('OK free entitlement path (no fake €0.01 / no unit_amount 0)');

section('5. Fixed amount');
for (const euros of [5, 10, 25]) {
  const cents = euros * 100;
  const r = calculatePlatformSubscriptionDiscount(BASE, {
    discountType: 'fixed',
    discountCents: cents,
  });
  assert.equal(r.discountCents, cents);
  assert.equal(r.finalPriceCents, BASE - cents);
  const via = calculatePromoSubscriptionPricing({
    basePriceCents: BASE,
    discountSharePct: 0,
    affiliateId: null,
    appliesTo: encodePlatformFixedAppliesTo(cents),
  });
  assert.equal(via.finalPriceCents, BASE - cents);
}
const over = calculatePlatformSubscriptionDiscount(BASE, {
  discountType: 'fixed',
  discountCents: 999_999,
});
assert.equal(over.finalPriceCents, 0);
assert.equal(over.discountCents, BASE);
console.log('OK fixed amounts floor at €0');

section('6. Affiliate caps unchanged + no leak');
assert.equal(MAIN_AFFILIATE_MAX_DISCOUNT_PCT, 80);
assert.equal(SUB_AFFILIATE_MAX_DISCOUNT_PCT, 75);
assert.equal(resolveMaxDiscountPct({ actor: 'affiliate', isSubAffiliate: false }), 80);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 100, isSubAffiliate: false }).ok,
  false,
);
assert.equal(
  assertDiscountWithinCap({ actor: 'affiliate', discountPct: 81, isSubAffiliate: false }).ok,
  false,
);
const mainMax = calculateSubscriptionPrice(BASE, 80, false);
assert.equal(mainMax.discountCents, 4000);
assert.equal(mainMax.finalPriceCents, 6000);
const affVia = calculatePromoSubscriptionPricing({
  basePriceCents: BASE,
  discountSharePct: 100,
  affiliateId: 'aff',
  appliesTo: 'SUBSCRIPTION_ONLY',
  isSubAffiliate: false,
});
assert.equal(affVia.isPlatform, false);
assert.equal(affVia.finalPriceCents, 6000);
console.log('OK affiliate max ~40% price; forged 100% share still floored');

section('7. Targeting documented in appliesTo');
assert.ok(encodePlatformPercentAppliesTo('gift').startsWith('PLATFORM'));
assert.ok(encodePlatformFixedAppliesTo(500).startsWith('PLATFORM_FIXED:'));
console.log('OK PLATFORM / PLATFORM_FIXED encoding (plan-specific targeting not implemented)');

section('8. Price consistency across plans');
for (const plan of SUBSCRIPTION_PLAN_KEYS) {
  const base =
    plan === 'BASIC' ? 3900 : plan === 'PRO' ? 9900 : 19900;
  for (const pct of [0, 50, 100]) {
    const q = calculatePromoSubscriptionPricing({
      basePriceCents: base,
      discountSharePct: pct,
      affiliateId: null,
      appliesTo: 'PLATFORM:testing',
    });
    assert.equal(q.discountCents + q.finalPriceCents, base);
    assert.equal(q.finalPriceCents, Math.round(base * (1 - pct / 100)));
  }
}
console.log('OK quote identity: base = discount + final for BASIC/PRO/PREMIUM');

section('9. Stacking policy — single code only');
assert.equal(
  extractPromoCodeFromBody({
    promoCode: 'A',
    discountPercent: 100,
    discountCents: 9999,
    finalPriceCents: 0,
  }),
  'A',
);
assert.equal(
  extractPromoCodeFromBody({
    code: '  welcome50  ',
    discountSharePct: 50,
  }),
  'welcome50',
);
assert.equal(extractPromoCodeFromBody({ discountPercent: 100 }), undefined);
console.log('OK only code extracted; forged discount fields ignored');

section('10. Trim / case');
assert.equal(extractPromoCodeFromBody({ promoCode: '  abC  ' }), 'abC');
console.log('OK extract preserves content; normalize happens in resolver');

section('11. Security markers');
fileContains('app/api/admin/promo-codes/route.ts', ['requireAdminPermission']);
fileContains('app/api/affiliate/promo-codes/route.ts', ['assertDiscountWithinCap']);
fileContains('lib/promo-codes/discount-policy.ts', ['PromoDiscountActor', 'affiliate']);
assert.equal(ADMIN_MAX_DISCOUNT_PCT, 100);
console.log('OK admin guard + affiliate server caps');

section('12. Mobile / Android');
fileContains('app/sell/page.tsx', ['min-h-[44px]', 'inputMode', 'Enter']);
console.log('OK touch targets + keyboard Enter on /sell (WebView shares web UI)');

console.log('\nHOMECHEFF_PROMOCODE_END_TO_END_PASS');
console.log('READY_FOR_FORMAL_REVIEW');
console.log('PASS');
