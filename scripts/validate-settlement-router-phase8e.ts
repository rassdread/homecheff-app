#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 8E — Settlement router & CTA finalization guard.
 *
 * Verifies every marketplace CTA entrypoint routes through settlement-router,
 * checkout API uses boolean settlement gate, copy keys exist NL/EN, no ad-hoc
 * routing on primary surfaces, legacy fallback intact, no Stripe logo on tile.
 *
 * Run: npx tsx scripts/validate-settlement-router-phase8e.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  productAllowsHomecheffCheckout,
  resolveCheckoutBlockReason,
  resolveMarketplaceCtaActions,
  resolveProposalCtaLabelKey,
  resolveSettlementFlow,
  resolveSettlementFlowAvailability,
  toMarketplaceCtaContext,
} from '@/lib/marketplace/settlement/settlement-router';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';

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

const CTA_SURFACES = [
  'components/product/detail/ProductSalePrimaryActions.tsx',
  'components/product/detail/ProductSaleStickyCta.tsx',
  'components/product/detail/ProductSaleCommerceZone.tsx',
  'components/product/detail/ProductSaleSecondaryContact.tsx',
  'components/marketplace/previews/MarketplacePreviewActions.tsx',
] as const;

console.log('=== UX-FIN Phase 8E — Settlement router & CTA finalization ===\n');

// --- 8E.1 Deliverables -------------------------------------------------------
console.log('8E.1 Deliverables');
assert(exists('docs/audits/SETTLEMENT_ROUTER_PHASE8E_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE8E_SETTLEMENT_ROUTER.md'), 'progress doc');
assert(exists('lib/marketplace/settlement/settlement-router.ts'), 'settlement-router present');

// --- 8E.2 Core routing rules (live) ------------------------------------------
console.log('\n8E.2 Core settlement → flow routing');
assert(resolveSettlementFlow('HOMECHEFF_CHECKOUT') === 'CHECKOUT', 'HomeCheff → CHECKOUT');
assert(resolveSettlementFlow('DIRECT_CONTACT') === 'PROPOSAL', 'Direct → PROPOSAL');
assert(resolveSettlementFlow('BARTER') === 'PROPOSAL', 'Barter → PROPOSAL');
assert(resolveSettlementFlow('ACCEPTED_VALUE') === 'PROPOSAL', 'Accepted value → PROPOSAL');

{
  const checkoutCta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { acceptHomeCheffPayment: true, acceptDirectContact: false, priceCents: 500 },
      { stripeConnectReady: true, hasContactChannels: true, inStock: true },
    ),
  );
  assert(checkoutCta.showCheckout && !checkoutCta.showContactOnly, 'checkout-only shows checkout CTA');

  const directCta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { acceptHomeCheffPayment: false, acceptDirectContact: true },
      { stripeConnectReady: true, hasContactChannels: true },
    ),
  );
  assert(!directCta.showCheckout && directCta.showProposal, 'direct-only → proposal, no checkout');
  assert(
    directCta.proposalLabelKey === 'marketplace.cta.arrangeDirect',
    'direct-only proposal label',
  );

  const barterCta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { acceptDirectContact: false, barterOpenness: 'BARTER_ONLY' },
      { hasContactChannels: true },
    ),
  );
  assert(!barterCta.showCheckout && barterCta.showProposal, 'barter-only → proposal');
  assert(barterCta.proposalLabelKey === 'marketplace.cta.discussBarter', 'barter proposal label');

  const valueCta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      {
        acceptDirectContact: false,
        acceptedSpecializations: ['create.meal'],
        barterOpenness: 'MONEY',
      },
      { hasContactChannels: true },
    ),
  );
  assert(!valueCta.showCheckout && valueCta.showProposal, 'accepted values → proposal');

  const requestCta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { listingIntent: 'REQUEST', acceptDirectContact: true },
      { hasContactChannels: true },
    ),
  );
  assert(
    requestCta.proposalLabelKey === 'marketplace.cta.makeProposal',
    'Gezocht → make proposal label',
  );

  const dual = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      {
        acceptHomeCheffPayment: true,
        acceptDirectContact: true,
        barterOpenness: 'MONEY_AND_BARTER',
        priceCents: 1000,
      },
      { stripeConnectReady: true, hasContactChannels: true, inStock: true },
    ),
  );
  assert(dual.showCheckout && dual.showProposal && dual.showDualPath, 'dual settlement shows both paths');

  const needsConnect = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { acceptHomeCheffPayment: true, acceptDirectContact: true, priceCents: 500 },
      { stripeConnectReady: false, hasContactChannels: true },
    ),
  );
  assert(needsConnect.checkoutNeedsConnect && needsConnect.showProposal, 'Connect missing → proposal path');
}

// --- 8E.3 CTA surfaces use settlement-router ---------------------------------
console.log('\n8E.3 CTA surfaces wired through settlement-router');
for (const surface of CTA_SURFACES) {
  const src = read(surface);
  assert(
    src.includes('resolveMarketplaceCtaActions') && src.includes('settlement-router'),
    `${path.basename(surface)} uses settlement-router`,
  );
}

const primary = read('components/product/detail/ProductSalePrimaryActions.tsx');
assert(
  !primary.includes('resolveDetailPageActions') &&
    !primary.includes('resolveProductCommerceActions') &&
    !primary.includes('isContactOnlyProduct'),
  'primary actions: no ad-hoc routing helpers',
);

const sticky = read('components/product/detail/ProductSaleStickyCta.tsx');
assert(
  !sticky.includes('resolveProductCommerceActions') && !sticky.includes('isContactOnlyProduct'),
  'sticky CTA: no ad-hoc routing',
);

const preview = read('components/marketplace/previews/MarketplacePreviewActions.tsx');
assert(
  !preview.includes('PROPOSAL_PREVIEW_KINDS') && !preview.includes('previewSupportsProposal'),
  'preview actions: no category-based proposal gate',
);
assert(preview.includes('resolveMarketplaceCtaActions'), 'preview uses settlement-router');

// --- 8E.4 Checkout API gate --------------------------------------------------
console.log('\n8E.4 Checkout API boolean gate');
const checkoutApi = read('app/api/checkout/route.ts');
assert(
  checkoutApi.includes('resolveCheckoutBlockReason') &&
    checkoutApi.includes('acceptHomeCheffPayment') &&
    checkoutApi.includes('acceptDirectContact'),
  'checkout API uses settlement-router block reason + booleans',
);
assert(
  !checkoutApi.includes('isContactOnlyProduct'),
  'checkout API does not rely on isContactOnlyProduct alone',
);

{
  assert(
    productAllowsHomecheffCheckout({
      acceptHomeCheffPayment: true,
      priceCents: 500,
      sellerStripeReady: true,
    }),
    'live: checkout allowed when booleans + connect ready',
  );
  assert(
    resolveCheckoutBlockReason({
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
    }) === 'CONTACT_ONLY',
    'live: contact-only block reason',
  );
  assert(
    resolveCheckoutBlockReason({ barterOpenness: 'BARTER_ONLY' }) === 'BARTER_ONLY',
    'live: barter-only block reason',
  );
  assert(
    resolveCheckoutBlockReason({
      acceptHomeCheffPayment: true,
      priceCents: 500,
      sellerStripeReady: false,
    }) === 'PAYMENTS_NOT_READY',
    'live: payments not ready block reason',
  );
}

// --- 8E.5 Legacy fallback ----------------------------------------------------
console.log('\n8E.5 Legacy orderMethod fallback');
{
  const legacyContact = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext({ orderMethod: 'CONTACT' }, { hasContactChannels: true }),
  );
  assert(!legacyContact.showCheckout && legacyContact.showProposal, 'legacy CONTACT → proposal');

  const legacyPay = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(
      { orderMethod: 'HOMECHEFF_PAYMENT', priceCents: 800 },
      { stripeConnectReady: true, hasContactChannels: true, inStock: true },
    ),
  );
  assert(legacyPay.showCheckout, 'legacy HOMECHEFF_PAYMENT + price → checkout');
}

// --- 8E.6 Copy / i18n --------------------------------------------------------
console.log('\n8E.6 CTA copy NL/EN parity');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
const ctaKeys = [
  'marketplace.cta.checkoutHomeCheff',
  'marketplace.cta.startConversation',
  'marketplace.cta.makeProposal',
  'marketplace.cta.discussBarter',
  'marketplace.cta.arrangeDirect',
];
for (const key of ctaKeys) {
  const nlVal = get(nl, key);
  const enVal = get(en, key);
  assert(typeof nlVal === 'string' && nlVal.length > 0, `NL: ${key}`);
  assert(typeof enVal === 'string' && enVal.length > 0, `EN: ${key}`);
}
assert(
  String(get(nl, 'marketplace.cta.checkoutHomeCheff')).includes('HomeCheff'),
  'NL checkout label mentions HomeCheff',
);

// --- 8E.7 No Stripe logo on tile ---------------------------------------------
console.log('\n8E.7 Tile settlement row (no Stripe logo)');
const settlementRowUi = read('components/marketplace/tiles/primitives/TileSettlementRow.tsx');
assert(!/StripeLogo|stripe[-_ ]?logo|\/stripe/i.test(settlementRowUi), 'no Stripe logo on tile');

// --- 8E.8 No performance regression ------------------------------------------
console.log('\n8E.8 Performance guards');
const routerSrc = read('lib/marketplace/settlement/settlement-router.ts');
assert(!/fetch\(|useSWR|prisma\./.test(routerSrc), 'settlement-router is sync, no fetch');
for (const surface of CTA_SURFACES) {
  assert(!/prisma\.|fetch\(/.test(read(surface)), `${path.basename(surface)}: no fetch in CTA`);
}

// --- 8E.9 Proposal label resolver ----------------------------------------------
console.log('\n8E.9 Proposal CTA label keys');
{
  const flows = resolveSettlementFlowAvailability(
    resolveSettlementOptions({ barterOpenness: 'BARTER_ONLY' }),
  );
  assert(
    resolveProposalCtaLabelKey(flows) === 'marketplace.cta.discussBarter',
    'barter-only label key',
  );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
