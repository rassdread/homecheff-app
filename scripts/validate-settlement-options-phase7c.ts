#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7C — Settlement options data wiring, Stripe Connect
 * guidance, offer-classification & preview/detail explanation guard.
 *
 * Verifies:
 *   7C.2  canonical settlement-options helper is the single source of truth.
 *   7C.5  feed selects both payment booleans + connect status; tile model
 *         carries HomeCheff/direct separately (not just one orderMethod).
 *   7C.6  tile settlement row is multi-icon, connect-gated, distinct icons.
 *   7C.4  Stripe Connect guidance exists with CTA to the existing route.
 *   7C.10 central settlement router: settlement choice → CHECKOUT vs PROPOSAL.
 *   7C.7/8 preview + detail explain settlement.
 *   7C.X  offer classification: OFFER stays "sale" regardless of price form;
 *         REQUEST stays "gezocht". (executed live against isMarketplaceSaleItem)
 *   perf/i18n guards stay green.
 *
 * Run: npx tsx scripts/validate-settlement-options-phase7c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isMarketplaceSaleItem } from '@/lib/feed/marketplace-sale';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import {
  resolveSettlementFlow,
  resolveSettlementFlowAvailability,
} from '@/lib/marketplace/settlement/settlement-router';

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
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}
function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function json(rel: string): any {
  try {
    return JSON.parse(read(rel));
  } catch {
    return {};
  }
}
function get(obj: any, dotted: string): unknown {
  return dotted.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

console.log('=== UX-FIN Phase 7C — Settlement options guard ===\n');

// --- 7C.2 canonical helper --------------------------------------------------
console.log('7C.2 Canonical settlement-options helper');
assert(exists('lib/marketplace/settlement/settlement-options.ts'), 'settlement-options helper present');
{
  const both = resolveSettlementOptions({
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    barterOpenness: 'MONEY_AND_BARTER',
    acceptedSpecializations: ['create.meal'],
    stripeConnectReady: true,
  });
  assert(both.acceptsHomeCheffCheckout && both.acceptsDirectContact, 'multiple options resolvable at once');
  assert(both.allowsBarter && both.hasAcceptedValues, 'barter + accepted values resolved independently');
  assert(both.canCheckoutNow, 'checkout available when selected + connect ready');

  const needsConnect = resolveSettlementOptions({
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    stripeConnectReady: false,
  });
  assert(!needsConnect.canCheckoutNow && needsConnect.homeCheffCheckoutNeedsConnect,
    'HomeCheff checkout NOT public when Connect missing (needsConnect true)');

  const legacyContact = resolveSettlementOptions({ orderMethod: 'CONTACT' });
  assert(legacyContact.acceptsDirectContact && !legacyContact.acceptsHomeCheffCheckout,
    'legacy orderMethod=CONTACT fallback → direct contact only');
  const legacyPay = resolveSettlementOptions({ orderMethod: 'HOMECHEFF_PAYMENT' });
  assert(legacyPay.acceptsHomeCheffCheckout, 'legacy orderMethod=HOMECHEFF fallback → checkout');
}

// --- 7C.10 central router ---------------------------------------------------
console.log('\n7C.10 Central settlement router (settlement → flow)');
assert(exists('lib/marketplace/settlement/settlement-router.ts'), 'settlement-router present');
assert(resolveSettlementFlow('HOMECHEFF_CHECKOUT') === 'CHECKOUT', 'HomeCheff Checkout → CHECKOUT flow');
assert(resolveSettlementFlow('DIRECT_CONTACT') === 'PROPOSAL', 'Direct contact → PROPOSAL flow');
assert(resolveSettlementFlow('BARTER') === 'PROPOSAL', 'Barter → PROPOSAL flow');
assert(resolveSettlementFlow('ACCEPTED_VALUE') === 'PROPOSAL', 'Accepted value → PROPOSAL flow');
{
  const avail = resolveSettlementFlowAvailability(
    resolveSettlementOptions({ acceptHomeCheffPayment: true, acceptDirectContact: true, stripeConnectReady: true }),
  );
  assert(avail.checkout && avail.proposal, 'both flows offered when seller allows both');
  const routerSrc = read('lib/marketplace/settlement/settlement-router.ts');
  assert(/NOT the category|listingIntent|priceModel/.test(routerSrc),
    'router documents: settlement choice drives flow, not intent/category/price');
}

// --- 7C.5 feed / tile wiring ------------------------------------------------
console.log('\n7C.5 Feed + tile carry both booleans + connect status');
const feed = read('app/api/feed/route.ts');
assert(feed.includes('acceptHomeCheffPayment: true') && feed.includes('acceptDirectContact: true'),
  'feed query selects both payment booleans');
assert(feed.includes('stripeConnectOnboardingCompleted: true'), 'feed query selects seller Connect completion');
assert(feed.includes('sellerStripeConnectReady'), 'feed emits sellerStripeConnectReady on items');
const card = read('components/feed/GeoFeedCards.tsx');
assert(card.includes('acceptHomeCheffPayment') && card.includes('acceptDirectContact') && card.includes('sellerStripeConnectReady'),
  'GeoFeedCardItem carries both booleans + connect');
const tileTypes = read('lib/marketplace/tiles/types.ts');
assert(tileTypes.includes('acceptsHomeCheffCheckout') && tileTypes.includes('acceptsDirectContact') && tileTypes.includes('homeCheffCheckoutConfigured'),
  'tile model carries HomeCheff/direct separately + connect flag');
const mapTile = read('lib/marketplace/tiles/map-to-tile-model.ts');
assert(mapTile.includes('resolveSettlementOptions'), 'tile mapping derives settlement from canonical helper');
assert(!/orderMethod:\s*deriveOrderMethod/.test(mapTile), 'tile mapping does not collapse to a single orderMethod for UI');

// --- no extra fetch / N+1 ---------------------------------------------------
console.log('\n7C.5 No extra fetch / N+1');
const settlementOptsSrc = read('lib/marketplace/settlement/settlement-options.ts');
const settlementRowSrc = read('lib/marketplace/tiles/build-tile-settlement-row.ts');
assert(!/fetch\(|useSWR|prisma\./.test(settlementOptsSrc + settlementRowSrc), 'settlement resolution does no fetching');

// --- 7C.6 tile settlement row ------------------------------------------------
console.log('\n7C.6 Tile settlement row (multi-icon, connect-gated, distinct)');
assert(settlementRowSrc.includes('resolveSettlementOptions'), 'settlement row uses canonical options');
assert(settlementRowSrc.includes('options.canCheckoutNow'), 'HomeCheff icon gated on canCheckoutNow (connect ready)');
const settlementRowUi = read('components/marketplace/tiles/primitives/TileSettlementRow.tsx');
assert(settlementRowUi.includes('ShieldCheck') && settlementRowUi.includes('Banknote') &&
  settlementRowUi.includes('Handshake') && settlementRowUi.includes('ArrowLeftRight'),
  'distinct icons: shield (HomeCheff) ≠ banknote (cash) ≠ handshake (barter) ≠ exchange (value)');
assert(!/StripeLogo|stripe[-_ ]?logo|\/stripe/i.test(settlementRowUi), 'no Stripe logo on tile settlement row');
{
  // Live: seller offers HomeCheff + direct but Connect not ready → only direct shows.
  const optsNoConnect = resolveSettlementOptions({
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    stripeConnectReady: false,
  });
  assert(!optsNoConnect.canCheckoutNow && optsNoConnect.acceptsDirectContact,
    'HomeCheff hidden publicly without Connect; direct contact still shown');
}

// --- 7C.4 Stripe Connect guidance -------------------------------------------
console.log('\n7C.4 Stripe Connect guidance + CTA');
const guidance = read('components/products/marketplace/SettlementConnectGuidance.tsx');
assert(exists('components/products/marketplace/SettlementConnectGuidance.tsx'), 'settlement Connect guidance component present');
assert(guidance.includes('marketplace.settlement.needsConnect') && guidance.includes('marketplace.settlement.connectReady'),
  'guidance shows both needs-connect + connect-ready states');
assert(guidance.includes('/api/stripe/connect/onboard'), 'CTA targets the existing Connect onboarding route');
assert(guidance.includes('marketplace.settlement.setupConnectCta'), 'CTA uses the setupConnect i18n key');
const form = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(form.includes('SettlementConnectGuidance') && form.includes('PaymentMethodCheckboxes'),
  'create/edit form renders guidance where HomeCheff Checkout is chosen');

// --- 7C.3 create/edit multiple options --------------------------------------
console.log('\n7C.3 Create/edit multiple settlement options');
const checkboxes = read('components/products/marketplace/PaymentMethodCheckboxes.tsx');
assert(checkboxes.includes('acceptHomeCheffPayment') && checkboxes.includes('acceptDirectContact'),
  'both payment options independently selectable');
assert(form.includes('BarterOpennessSelector') && form.includes('AcceptedValuesPicker'),
  'barter + accepted values selectable alongside payment');

// --- 7C.7 preview / 7C.8 detail explanation ---------------------------------
console.log('\n7C.7/7C.8 Preview + detail settlement explanation');
const preview = read('components/marketplace/previews/MarketplacePreviewCard.tsx');
assert(preview.includes('PreviewSettlement') && preview.includes('resolveSettlementOptions'),
  'preview explains settlement from canonical options');
assert(preview.includes('marketplace.preview.settlement.requestHeading'), 'preview adapts direction for Gezocht');
assert(exists('components/product/detail/ProductDetailSettlementSection.tsx'), 'detail settlement section present');
const detailSection = read('components/product/detail/ProductDetailSettlementSection.tsx');
assert(detailSection.includes('marketplace.detail.settlement.needsConnect'), 'detail explains why HomeCheff Checkout may be unavailable');
assert(read('components/product/detail/ProductDetailMainSections.tsx').includes('ProductDetailSettlementSection'),
  'detail settlement section wired into detail page');

// --- 7C.X offer classification (LIVE) ---------------------------------------
console.log('\n7C.X Offer classification — OFFER stays sale regardless of value form');
const P = (extra: Record<string, unknown>) => ({ feedSource: 'PRODUCT', listingIntent: 'OFFER', ...extra });
assert(isMarketplaceSaleItem(P({ priceModel: 'FIXED', priceCents: 1200 })), 'OFFER + fixed price → sale');
assert(isMarketplaceSaleItem(P({ priceModel: 'ON_REQUEST', priceCents: 0 })), 'OFFER + on-request price → sale');
assert(isMarketplaceSaleItem(P({ priceModel: 'VOLUNTARY', priceCents: 0 })), 'OFFER + voluntary → sale');
assert(isMarketplaceSaleItem(P({ barterOpenness: 'BARTER_ONLY', priceCents: 0 })), 'OFFER + barter only → sale');
assert(isMarketplaceSaleItem(P({ acceptedSpecializations: ['create.meal'], priceCents: 0 })), 'OFFER + accepted values only → sale');
assert(isMarketplaceSaleItem(P({ orderMethod: 'CONTACT', priceCents: 0 })), 'OFFER + direct contact only → sale');
assert(!isMarketplaceSaleItem(P({ listingIntent: 'REQUEST', priceCents: 1500 })), 'REQUEST + budget → NOT sale (gezocht)');
assert(!isMarketplaceSaleItem(P({ listingIntent: 'REQUEST', barterOpenness: 'BARTER_ONLY', priceCents: 0 })),
  'REQUEST + barter/value → NOT sale (gezocht)');

// --- i18n parity ------------------------------------------------------------
console.log('\ni18n parity — settlement (nl + en)');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const k of ['homeCheffCheckout', 'directContact', 'barter', 'acceptedValues', 'needsConnect', 'connectReady', 'setupConnectCta']) {
  assert(!!get(nl, `marketplace.settlement.${k}`) && !!get(en, `marketplace.settlement.${k}`),
    `marketplace.settlement.${k} present nl + en`);
}
for (const k of ['homeCheffCheckout', 'directContact', 'barter', 'acceptedValues', 'requestHeading']) {
  assert(!!get(nl, `marketplace.preview.settlement.${k}`) && !!get(en, `marketplace.preview.settlement.${k}`),
    `marketplace.preview.settlement.${k} present nl + en`);
}
for (const k of ['title', 'homeCheffCheckout', 'directContact', 'barter', 'acceptedValues', 'needsConnect']) {
  assert(!!get(nl, `marketplace.detail.settlement.${k}`) && !!get(en, `marketplace.detail.settlement.${k}`),
    `marketplace.detail.settlement.${k} present nl + en`);
}

// --- performance guards -----------------------------------------------------
console.log('\nPerformance architecture frozen');
assert(read('lib/feed/homeDesktopFeedColumns.ts').includes('return 2'), 'desktop default 2 columns preserved');
assert(read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'), 'homepage return cache preserved');
assert(read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'), 'unified SWR cache preserved');
for (const guard of [
  'scripts/validate-marketplace-tile-payment-semantics-phase7b.ts',
  'scripts/validate-first-run-clarity-phase7a.ts',
  'scripts/validate-shared-ui-phase6b.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
