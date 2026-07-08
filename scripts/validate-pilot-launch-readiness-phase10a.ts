#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 10A — Pilot launch readiness guard.
 *
 * Audit-first: pins architecture from Phases 7A–9B, verifies pilot-critical
 * surfaces, terminology/navigation/CTA/trust/SEO consistency, and performance
 * regression guards. No new architecture allowed.
 *
 * Run: npx tsx scripts/validate-pilot-launch-readiness-phase10a.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

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
  'components/marketplace/previews/MarketplacePreviewActions.tsx',
  'app/api/checkout/route.ts',
];

const TILE_PIPELINE = [
  'lib/marketplace/tiles/map-to-tile-model.ts',
  'lib/marketplace/tiles/build-tile-settlement-row.ts',
  'lib/marketplace/tiles/types.ts',
];

const PRIOR_VALIDATORS = [
  'scripts/validate-brand-implementation-phase9b.ts',
  'scripts/validate-brand-positioning-phase9a.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-marketplace-value-economy-phase8d.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
  'scripts/validate-settlement-options-phase7c.ts',
  'scripts/validate-marketplace-architecture-phase7d.ts',
];

console.log('=== UX-FIN Phase 10A — Pilot launch readiness ===\n');

// --- 10A.1 Deliverables -------------------------------------------------------
console.log('10A.1 Deliverables');
assert(exists('docs/audits/PILOT_LAUNCH_READINESS_PHASE10A_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE10A_PILOT_READINESS.md'), 'progress doc');
assert(exists('scripts/validate-pilot-launch-readiness-phase10a.ts'), 'validator script');

// --- 10A.2 Canonical architecture unchanged -----------------------------------
console.log('\n10A.2 Canonical architecture (7A–9B)');
const archFiles = [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
];
for (const f of archFiles) {
  assert(exists(f), f);
}
const canonical = read('lib/marketplace/canonical-model.ts');
assert(!canonical.includes('Phase 10A'), 'canonical-model: no 10A arch stamp');
const settlementOpts = read('lib/marketplace/settlement/settlement-options.ts');
assert(settlementOpts.includes('resolveSettlementOptions'), 'settlement-options SSOT');
const settlementRouter = read('lib/marketplace/settlement/settlement-router.ts');
assert(
  settlementRouter.includes('resolveMarketplaceCtaActions'),
  'settlement-router: CTA resolver',
);

// --- 10A.3 No duplicate settlement systems ----------------------------------
console.log('\n10A.3 No parallel settlement implementations');
for (const surface of CTA_SURFACES) {
  const src = read(surface);
  assert(src.includes('settlement-router'), `${path.basename(surface)} → settlement-router`);
}
assert(
  !read('components/product/detail/ProductSalePrimaryActions.tsx').includes(
    'orderMethod ===',
  ),
  'primary actions: no ad-hoc orderMethod routing',
);

// --- 10A.4 Tile pipeline + reverse discovery ----------------------------------
console.log('\n10A.4 Tile pipeline + reverse discovery');
for (const f of TILE_PIPELINE) {
  assert(exists(f), f);
}
const tileRow = read('lib/marketplace/tiles/build-tile-settlement-row.ts');
assert(tileRow.includes('resolveSettlementOptions'), 'tile settlement row uses SSOT');
assert(exists('lib/marketplace/discovery/reverse-discovery-session.ts'), 'reverse discovery session');

// --- 10A.5 Taxonomy SSOT ------------------------------------------------------
console.log('\n10A.5 Taxonomy SSOT');
assert(exists('lib/marketplace/taxonomy-resolve.ts'), 'taxonomy-resolve');
assert(
  read('components/products/marketplace/AcceptedValuesPicker.tsx').includes(
    'taxonomy-resolve',
  ),
  'accepted values picker uses taxonomy SSOT',
);
assert(
  read('components/products/marketplace/AcceptedValuesPicker.tsx').includes(
    'PendingAcceptedValueProposalForm',
  ),
  'accepted values picker: pending proposals',
);

// --- 10A.6 Pilot fixes — edit settlement prefill ------------------------------
console.log('\n10A.6 Edit listing settlement prefill');
const offerForm = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(offerForm.includes('resolveSettlementOptions'), 'offer form: settlement SSOT prefill');
assert(offerForm.includes('setAcceptHomeCheffPayment'), 'offer form: checkout checkbox prefill');
const editPage = read('app/product/[id]/edit/page.tsx');
assert(editPage.includes('acceptHomeCheffPayment'), 'edit page: passes settlement booleans');
assert(editPage.includes('acceptDirectContact'), 'edit page: passes direct contact boolean');

// --- 10A.7 Orders page i18n (EN pilot) ----------------------------------------
console.log('\n10A.7 Buyer orders i18n');
const ordersPage = read('app/orders/page.tsx');
assert(ordersPage.includes('useTranslation'), 'orders page: useTranslation');
assert(!ordersPage.includes('Inloggen vereist'), 'orders page: no hardcoded NL login title');
assert(!ordersPage.includes('Mijn Aankopen'), 'orders page: no hardcoded NL title');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const key of [
  'orders.title',
  'orders.loginTitle',
  'orders.continueShopping',
  'orders.writeReview',
]) {
  assert(typeof get(nl, key) === 'string' && String(get(nl, key)).length > 2, `NL: ${key}`);
  assert(typeof get(en, key) === 'string' && String(get(en, key)).length > 2, `EN: ${key}`);
}

// --- 10A.8 Terminology consistency --------------------------------------------
console.log('\n10A.8 Terminology');
const discoverNl = String(get(nl, 'discover.hubSubtitle') ?? '');
const discoverEn = String(get(en, 'discover.hubSubtitle') ?? '');
assert(/aangeboden/i.test(discoverNl), 'NL discover hub: aangeboden');
assert(/offered/i.test(discoverEn), 'EN discover hub: offered');
assert(
  String(get(nl, 'faq.general.0.answer') ?? '').match(/ruil|waarde|barter/i),
  'NL FAQ: value exchange',
);
const brand = read('docs/brand/HOMECHEFF_BRAND_LANGUAGE.md');
assert(brand.includes('local craft, exchange and community platform'), 'brand SSOT EN');

// --- 10A.9 Navigation + CTA consistency -------------------------------------
console.log('\n10A.9 Navigation + CTA');
assert(exists('components/navigation/BottomNavigation.tsx'), 'bottom nav');
assert(exists('components/NavBar.tsx'), 'header nav');
const ctaNl = String(get(nl, 'marketplace.cta.checkoutHomeCheff') ?? '');
const ctaEn = String(get(en, 'marketplace.cta.checkoutHomeCheff') ?? '');
assert(ctaNl.length > 3 && ctaEn.length > 3, 'marketplace.cta.checkoutHomeCheff NL/EN');

// --- 10A.10 Trust surfaces ----------------------------------------------------
console.log('\n10A.10 Trust');
assert(
  exists('components/product/detail/ProductDetailSettlementSection.tsx'),
  'detail settlement section',
);
assert(
  read('components/products/marketplace/SettlementConnectGuidance.tsx').length > 100,
  'Stripe Connect guidance component',
);

// --- 10A.11 SEO (9B verification) -------------------------------------------
console.log('\n10A.11 SEO (9B carry-forward)');
const manifest = read('public/manifest.json');
assert(!/thuisgebracht/i.test(manifest) || /dorpsplein|community/i.test(manifest), 'manifest: broad positioning');
const orgNl = String(get(nl, 'home.schemaOrganizationDescription') ?? '');
assert(!/alleen.*eten|only.*food/i.test(orgNl), 'org schema: not food-only');
assert(exists('lib/seo/faqStructuredData.ts'), 'FAQ structured data');
assert(exists('app/seo-hub/page.tsx') || exists('app/(marketing)/seo-hub/page.tsx') || read('lib/seo/homecheffSeoPages.ts').includes('seo-hub'), 'SEO hub');

// --- 10A.12 Performance regression guards -------------------------------------
console.log('\n10A.12 Performance guards');
const geoFeed = read('components/feed/GeoFeed.tsx');
assert(!geoFeed.includes('QueryClientProvider'), 'GeoFeed: no extra QueryClientProvider');
assert(exists('scripts/validate-platform-performance-phase4b.ts'), '4B perf validator exists');
const feedRoute = read('app/api/feed/route.ts');
assert(feedRoute.includes('acceptHomeCheffPayment'), 'feed API: settlement booleans in payload');

// --- 10A.13 Mobile / a11y baseline ------------------------------------------
console.log('\n10A.13 Mobile baseline');
assert(
  read('components/product/detail/ProductSaleStickyCta.tsx').includes('sticky'),
  'sticky CTA on mobile detail',
);
assert(
  offerForm.includes('min-h-') || editPage.includes('min-h-'),
  'forms use dynamic viewport height',
);

// --- 10A.14 Stripe Connect guidance (no duplicate logic) ----------------------
console.log('\n10A.14 Stripe Connect');
assert(
  offerForm.includes('SettlementConnectGuidance'),
  'create/edit: SettlementConnectGuidance',
);
assert(
  !offerForm.includes('resolveMarketplaceCtaActions'),
  'form does not duplicate CTA router',
);

// --- 10A.15 Prior validators exist --------------------------------------------
console.log('\n10A.15 Prior phase validators');
for (const script of PRIOR_VALIDATORS) {
  assert(exists(script), script);
}

// --- 10A.16 Run prior validators (chain) --------------------------------------
console.log('\n10A.16 Chained validator execution');
for (const script of PRIOR_VALIDATORS) {
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
