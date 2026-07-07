#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 3A — Money Path + Critical Copy Polish validation.
 *
 * Verifies the P0/P1 quick wins from the Phase 3 audit are actually fixed:
 *   3A.1  t() interpolation supports both {count} and {{count}} (no stray braces)
 *   3A.2  Cart shows the real seller name (no hardcoded "van Verkoper")
 *   3A.3  Payment success shows a product title (no raw "Product ID: <cuid>")
 *   3A.4  Money path (checkout/cart/success) copy runs through i18n, nl/en parity,
 *         no `t('key') || 'Dutch fallback'` pattern
 *   3A.5  admin.overview is "Overview" (was "Aboutview")
 *   3A.6  Seller status logic branches on the raw enum (statusRaw)
 *
 * Run: npx tsx scripts/validate-ux-fin-3a-critical-polish.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { interpolateTranslation } from '../lib/i18n/interpolate';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(read(`public/i18n/${locale}.json`));
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

console.log('=== UX-FIN Phase 3A — Money Path + Critical Copy Polish ===\n');

const en = loadI18n('en');
const nl = loadI18n('nl');

// --- 3A.1 interpolation --------------------------------------------------
console.log('3A.1 i18n interpolation ({x} and {{x}})');
assert(
  interpolateTranslation('{count} afgeronde afspraken', { count: 5 }) === '5 afgeronde afspraken',
  'single-brace {count} interpolates',
);
assert(
  interpolateTranslation('{{count}} afgeronde afspraken', { count: 5 }) === '5 afgeronde afspraken',
  'double-brace {{count}} interpolates',
);
assert(
  interpolateTranslation('{{count}} of {total}', { count: 2, total: 9 }) === '2 of 9',
  'mixed single + double braces interpolate together',
);
assert(
  interpolateTranslation('{count} left', {}) === '{count} left',
  'missing value leaves placeholder intact (no crash)',
);
assert(
  interpolateTranslation('{{count}} items', { count: 0 }) === '0 items',
  'zero value interpolates (not treated as missing)',
);
assert(
  !interpolateTranslation('{{count}} items', { count: 3 }).includes('{'),
  'no stray braces remain after double-brace interpolation',
);

// Real trust-cue keys with {{ }} render clean.
let doubleBraceKeyChecked = false;
const stack: Array<{ node: unknown; keyPath: string }> = [{ node: en, keyPath: '' }];
while (stack.length) {
  const { node, keyPath } = stack.pop()!;
  if (typeof node === 'string') {
    if (node.includes('{{')) {
      const rendered = interpolateTranslation(node, { count: 5, rating: 4, total: 9, name: 'X' });
      if (!doubleBraceKeyChecked) {
        assert(
          !/\{\{|\}\}/.test(rendered),
          `trust-cue key "${keyPath}" renders without {{ }} braces`,
        );
        doubleBraceKeyChecked = true;
      }
    }
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      stack.push({ node: v, keyPath: keyPath ? `${keyPath}.${k}` : k });
    }
  }
}
assert(doubleBraceKeyChecked, 'at least one {{ }} key exists and was verified');

// --- 3A.2 cart seller name ----------------------------------------------
console.log('\n3A.2 Cart seller display');
const cartDrawer = read('components/cart/CartDrawer.tsx');
assert(!cartDrawer.includes('van Verkoper'), 'CartDrawer has no hardcoded "van Verkoper"');
assert(cartDrawer.includes('item.sellerName'), 'CartDrawer uses item.sellerName');
assert(cartDrawer.includes("t('cart.soldBy'"), 'CartDrawer renders seller via cart.soldBy');
assert(cartDrawer.includes("t('cart.providerFallback')"), 'CartDrawer falls back to cart.providerFallback');
assert(
  typeof getNested(en, 'cart.providerFallback') === 'string' &&
    typeof getNested(nl, 'cart.providerFallback') === 'string',
  'cart.providerFallback exists in nl + en',
);
const useCart = read('hooks/useCart.ts');
assert(!useCart.includes("'Verkoper'"), 'useCart no longer stores hardcoded "Verkoper" fallback');

// --- 3A.3 payment success product title ----------------------------------
console.log('\n3A.3 Payment success product title');
const success = read('app/payment/success/page.tsx');
assert(!success.includes('Product ID:'), 'payment success has no raw "Product ID:" label');
assert(success.includes('productTitleById'), 'payment success maps productId → title from polled order');
assert(success.includes("t('paymentSuccess.productFallback')"), 'payment success uses translated Product fallback');
assert(
  typeof getNested(en, 'paymentSuccess.productFallback') === 'string' &&
    typeof getNested(nl, 'paymentSuccess.productFallback') === 'string',
  'paymentSuccess.productFallback exists in nl + en',
);

// --- 3A.4 money path i18n ------------------------------------------------
console.log('\n3A.4 Money path i18n + parity');
const checkout = read('app/checkout/page.tsx');

// No obvious hardcoded Dutch strings left in the money-path screens.
const dutchLiterals = ['Bestelling Overzicht', 'Subtotaal', 'Bezorgkosten', 'Transactiekosten', 'Verwerken...', 'Onbekend adres'];
for (const lit of dutchLiterals) {
  assert(!checkout.includes(`>${lit}`) && !checkout.includes(`'${lit}'`) && !checkout.includes(` ${lit}\n`),
    `checkout no longer hardcodes "${lit}"`);
}
assert(!success.includes('Betaling succesvol!'), 'payment success title runs through i18n');
assert(!success.includes('Wat gebeurt er nu?'), 'payment success "what next" runs through i18n');

// No `t('key') || 'Dutch fallback'` in the money-path screens.
const dutchFallbackRe = /t\([^)]*\)\s*\|\|\s*'[^']*[a-z]{3}/;
assert(!dutchFallbackRe.test(checkout), "checkout has no t('key') || 'fallback' pattern");
assert(!dutchFallbackRe.test(success), "payment success has no t('key') || 'fallback' pattern");
assert(!dutchFallbackRe.test(cartDrawer), "CartDrawer has no t('key') || 'fallback' pattern");

// nl/en parity for the new namespaces.
const PARITY_KEYS = [
  'cart.titleWithCount',
  'cart.soldBy',
  'cart.checkoutWithCount',
  'checkout.summaryTitle',
  'checkout.subtotal',
  'checkout.deliveryFee',
  'checkout.transactionFeeStripe',
  'checkout.total',
  'checkout.payNow',
  'checkout.processing',
  'checkout.trustLine',
  'checkout.deliveryOption',
  'checkout.pickup',
  'paymentSuccess.successTitle',
  'paymentSuccess.orderTitle',
  'paymentSuccess.whatNextTitle',
  'paymentSuccess.toMyPurchases',
];
for (const key of PARITY_KEYS) {
  const e = getNested(en, key);
  const n = getNested(nl, key);
  assert(typeof e === 'string' && (e as string).length > 0, `en has ${key}`);
  assert(typeof n === 'string' && (n as string).length > 0, `nl has ${key}`);
}

// Every checkout.* key referenced in the checkout page exists in both locales.
const referenced = new Set<string>();
for (const m of checkout.matchAll(/t\('(checkout\.[a-zA-Z0-9.]+)'/g)) {
  referenced.add(m[1]);
}
let missingCheckout = 0;
for (const key of referenced) {
  if (typeof getNested(en, key) !== 'string' || typeof getNested(nl, key) !== 'string') {
    missingCheckout++;
    console.log(`     · missing key: ${key}`);
  }
}
assert(referenced.size > 20, `checkout references many i18n keys (${referenced.size})`);
assert(missingCheckout === 0, 'every referenced checkout.* key exists in nl + en');

// --- 3A.5 Aboutview ------------------------------------------------------
console.log('\n3A.5 admin copy bug');
assert(getNested(en, 'admin.overview') === 'Overview', 'admin.overview is "Overview" (not "Aboutview")');
assert(
  getNested(en, 'admin.orderManagementDescription') === 'Overview and management of all orders',
  'admin.orderManagementDescription fixed',
);
const enFlat = read('public/i18n/en.json');
assert(!enFlat.includes('Aboutview') && !enFlat.includes('aboutview'), 'no "Aboutview/aboutview" left in en.json');
assert(!enFlat.includes('Discabout') && !enFlat.includes('discabout'), 'no "Discabout/discabout" left in en.json');

// --- 3A.6 seller status enum --------------------------------------------
console.log('\n3A.6 Seller status enum logic');
const dashboard = read('app/verkoper/dashboard/page-client.tsx');
const sellerOrders = read('app/verkoper/orders/page-client.tsx');
const ordersApi = read('app/api/seller/dashboard/orders/route.ts');
assert(ordersApi.includes('statusRaw: order.status'), 'seller orders API returns raw enum as statusRaw');
assert(dashboard.includes('statusRaw') && dashboard.includes('orderIsInEnumState'), 'dashboard branches on statusRaw');
assert(
  !dashboard.includes("o.status === 'Bevestigd'") && !dashboard.includes("order.status === 'Bevestigd'"),
  'dashboard no longer decides on Dutch label "Bevestigd"',
);
assert(sellerOrders.includes('statusRaw') && sellerOrders.includes('orderIsInEnumState'), 'seller orders page branches on statusRaw');
assert(
  !sellerOrders.includes("order.status === 'Bevestigd'") && !sellerOrders.includes("order.status === 'Verzonden'"),
  'seller orders page no longer decides on Dutch labels',
);
assert(sellerOrders.includes("t('seller.refunded')"), 'refunded status uses i18n (no hardcoded "Terugbetaald")');
assert(sellerOrders.includes("t('seller.new')") && sellerOrders.includes("t('seller.ongoing')"), 'seller order tabs use i18n labels');

// --- 3A.7 console logs ---------------------------------------------------
console.log('\n3A.7 Stripped production console logs');
assert(!read('app/orders/page.tsx').includes('Mijn Aankopen: Fetching'), 'buyer orders page debug log removed');
assert(!read('components/delivery/DeliveryDashboard.tsx').includes('Starting Stripe Connect onboarding'), 'delivery dashboard debug log removed');
assert(!ordersApi.includes('Seller Dashboard Orders API: Fetching'), 'seller orders API debug log removed');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
