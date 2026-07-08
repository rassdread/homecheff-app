#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 8D — Marketplace value economy UX completion guard.
 *
 * Run: npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import { isContactOnlyProduct, isHomecheffCheckoutProduct } from '@/lib/product/order-method';
import { mapFavoriteRecordToTileModel } from '@/lib/marketplace/tiles/map-favorite-to-tile-model';

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
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}
function json(rel: string): Record<string, unknown> {
  try {
    return JSON.parse(read(rel)) as Record<string, unknown>;
  } catch {
    return {};
  }
}
function get(obj: Record<string, unknown>, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in (acc as object)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

console.log('=== UX-FIN Phase 8D — Value economy UX completion ===\n');

// --- 8D.1 Deliverables -------------------------------------------------------
console.log('8D.1 Deliverables');
assert(exists('docs/audits/MARKETPLACE_VALUE_ECONOMY_PHASE8D_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE8D_VALUE_ECONOMY.md'), 'progress doc');

// --- 8D.2 Canonical terminology on feed ------------------------------------
console.log('\n8D.2 Feed terminology alignment');
const geo = read('components/feed/GeoFeed.tsx');
assert(geo.includes('marketplace.canonical.view.offered'), 'Gezocht empty uses canonical offered label');
assert(!geo.includes('feed.chipSale') || geo.includes('marketplace.canonical.view.offered'), 'chipSale not sole empty CTA label');
assert(geo.includes('DiscoveryDirectionToggle'), 'bidirectional discovery present');
assert(geo.includes('resolveSettlementOptions') === false, 'GeoFeed has no duplicate settlement logic');

// --- 8D.3 Detail accepted values clarity -------------------------------------
console.log('\n8D.3 Detail accepted values');
const detailAccepted = read('components/product/detail/ProductDetailAcceptedValuesSection.tsx');
assert(detailAccepted.includes('sellerAcceptsHeading'), 'detail uses seller accepts heading');
assert(detailAccepted.includes('acceptedValues.description'), 'detail includes helper description');

// --- 8D.4 Detail settlement boolean pass-through -----------------------------
console.log('\n8D.4 Detail settlement data integrity');
const listingDetail = read('components/product/ListingDetailPage.tsx');
const mainSections = read('components/product/detail/ProductDetailMainSections.tsx');
assert(listingDetail.includes('acceptHomeCheffPayment'), 'ListingDetailPage reads acceptHomeCheffPayment');
assert(listingDetail.includes('acceptDirectContact'), 'ListingDetailPage reads acceptDirectContact');
assert(mainSections.includes('acceptHomeCheffPayment'), 'main sections accept settlement booleans');
assert(mainSections.includes('ProductDetailSettlementSection'), 'settlement section on detail');

// --- 8D.5 Commerce helper boolean awareness ----------------------------------
console.log('\n8D.5 Commerce helpers');
assert(
  !isContactOnlyProduct({
    orderMethod: 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
  }),
  'dual settlement is not contact-only',
);
assert(
  isContactOnlyProduct({
    orderMethod: 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: false,
    acceptDirectContact: true,
  }),
  'direct-only via booleans is contact-only',
);
assert(
  isHomecheffCheckoutProduct({
    orderMethod: 'CONTACT',
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
  }),
  'dual settlement offers HomeCheff via booleans',
);

// --- 8D.6 Favorites settlement SSOT ------------------------------------------
console.log('\n8D.6 Favorites tiles');
const favMapper = read('lib/marketplace/tiles/map-favorite-to-tile-model.ts');
assert(favMapper.includes('resolveSettlementOptions'), 'favorites use settlement SSOT');
assert(!favMapper.includes('acceptsHomeCheffCheckout: true'), 'favorites no hardcoded checkout true');
{
  const model = mapFavoriteRecordToTileModel(
    {
      Product: {
        id: 'p1',
        title: 'Test',
        orderMethod: 'CONTACT',
        acceptHomeCheffPayment: false,
        acceptDirectContact: true,
      },
    },
    null,
  );
  assert(model?.acceptsDirectContact === true, 'favorite maps direct contact');
  assert(model?.acceptsHomeCheffCheckout === false, 'favorite maps no HomeCheff');
}

// --- 8D.7 Create flow Connect guidance ---------------------------------------
console.log('\n8D.7 Create flow Connect guidance');
const offerForm = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(offerForm.includes('SettlementConnectGuidance'), 'create form has Connect guidance');
assert(!offerForm.includes('StripeConnectPaymentsBanner'), 'duplicate Stripe banner removed');

// --- 8D.8 Settlement SSOT still canonical ------------------------------------
console.log('\n8D.8 Settlement SSOT');
assert(exists('lib/marketplace/settlement/settlement-options.ts'), 'settlement-options helper');
assert(exists('lib/marketplace/canonical-model.ts'), 'canonical model');
{
  const both = resolveSettlementOptions({
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    stripeConnectReady: true,
    acceptedSpecializations: ['create.fruit'],
  });
  assert(both.canCheckoutNow && both.canDiscussDirectly, 'multi-settlement resolves');
}

// --- 8D.9 Proposal + reverse discovery continuity ----------------------------
console.log('\n8D.9 Proposal continuity');
const prefill = read('lib/proposals/proposal-prefill.ts');
const startChat = read('components/chat/StartChatButton.tsx');
assert(prefill.includes('reverseDiscoveryOfferIds'), 'proposal prefill reverse discovery');
assert(startChat.includes('peekReverseDiscoveryOfferIds'), 'StartChat reads reverse session');

// --- 8D.10 i18n parity -------------------------------------------------------
console.log('\n8D.10 i18n value-economy copy');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
const keys = [
  'marketplace.detail.acceptedValues.sellerAcceptsHeading',
  'marketplace.canonical.view.offered',
  'marketplace.discovery.direction.offer',
];
for (const key of keys) {
  assert(typeof get(nl, key) === 'string', `nl ${key}`);
  assert(typeof get(en, key) === 'string', `en ${key}`);
}
const chipIntroNl = get(nl, 'feed.chipSectionIntro');
assert(
  typeof chipIntroNl === 'string' && chipIntroNl.includes('gezocht'),
  'nl chip intro mentions gezocht',
);

// --- 8D.11 No parallel taxonomy / hardcoded lists ----------------------------
console.log('\n8D.11 Taxonomy integrity');
const picker = read('components/products/marketplace/AcceptedValuesPicker.tsx');
assert(picker.includes('getAcceptedValueTaxonomyItems'), 'picker uses taxonomy SSOT');
assert(!/const\s+SETTLEMENT_OPTIONS\s*=\s*\[/.test(offerForm + geo), 'no hardcoded settlement option lists');

// --- 8D.12 Performance guards ------------------------------------------------
console.log('\n8D.12 Performance guards');
assert(!offerForm.includes('fetch(\'/api/feed'), 'create form no extra feed fetch');
assert(!detailAccepted.includes('usePendingAcceptedValueRegistry') || detailAccepted.includes('buildDetailAcceptedValuesPresentation'), 'detail accepted values reuse presentation builder');

// --- 8D.13 Cross-validator references ----------------------------------------
console.log('\n8D.13 Prior phase guards still present');
assert(exists('scripts/validate-settlement-options-phase7c.ts'), '7C validator');
assert(exists('scripts/validate-reverse-discovery-phase8c.ts'), '8C validator');
assert(exists('lib/marketplace/discovery/accepted-values-discovery.ts'), '8B discovery lib');

console.log(`\n=== Phase 8D: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
