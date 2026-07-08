#!/usr/bin/env npx tsx
/**
 * Phase 11A — Release Candidate (RC1) final acceptance guard.
 *
 * Audit-first: chains Phases 7A–10E validators, pins frozen architecture,
 * verifies pilot UX flows, terminology, accessibility, and no duplicate systems.
 *
 * Run: npx tsx scripts/validate-release-candidate-phase11a.ts
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

const ARCH_SSOT = [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
  'lib/marketplace/taxonomy-resolve.ts',
  'lib/marketplace/discovery/reverse-discovery-session.ts',
  'lib/marketplace/discovery/accepted-values-discovery.ts',
  'lib/marketplace/tiles/map-to-tile-model.ts',
  'lib/marketplace/tiles/build-tile-settlement-row.ts',
  'lib/feed/home-filter-persist.ts',
];

const PRIOR_VALIDATORS = [
  'scripts/validate-production-backfill-phase10e.ts',
  'scripts/validate-marketplace-discovery-completion-phase10d.ts',
  'scripts/validate-marketplace-data-normalization-phase10c.ts',
  'scripts/validate-pilot-polish-phase10b.ts',
  'scripts/validate-pilot-launch-readiness-phase10a.ts',
  'scripts/validate-brand-implementation-phase9b.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
  'scripts/validate-settlement-options-phase7c.ts',
  'scripts/validate-marketplace-architecture-phase7d.ts',
];

const CRITICAL_I18N_KEYS = [
  'marketplace.canonical.view.offered',
  'marketplace.canonical.view.wanted',
  'marketplace.canonical.category.services',
  'marketplace.discovery.usp.tagline',
  'marketplace.detail.settlement.acceptedValues',
  'favoritesHub.guestLoginTitle',
  'favoritesHub.guestLoginCta',
  'orders.title',
  'homePhase1.heroValueExchange',
];

console.log('=== Phase 11A — Release Candidate RC1 ===\n');

// --- 11A.1 Deliverables -------------------------------------------------------
console.log('11A.1 Deliverables');
assert(exists('docs/audits/RELEASE_CANDIDATE_PHASE11A_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE11A_RELEASE_CANDIDATE.md'),
  'progress doc',
);
assert(exists('scripts/validate-release-candidate-phase11a.ts'), 'validator script');

// --- 11A.2 Frozen architecture (7A–10E) -------------------------------------
console.log('\n11A.2 Frozen architecture — no regressions');
for (const f of ARCH_SSOT) {
  assert(exists(f), f);
}
const canonical = read('lib/marketplace/canonical-model.ts');
assert(!canonical.includes('Phase 11A'), 'canonical-model: no 11A arch stamp');
assert(canonical.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'), 'canonical category chips');
assert(
  canonical.includes("slug: 'services'"),
  'canonical model includes services category',
);
assert(
  read('lib/marketplace/settlement/settlement-options.ts').includes('resolveSettlementOptions'),
  'settlement-options SSOT',
);
assert(
  read('lib/marketplace/settlement/settlement-router.ts').includes('resolveMarketplaceCtaActions'),
  'settlement-router SSOT',
);

// --- 11A.3 No duplicate / parallel systems ----------------------------------
console.log('\n11A.3 No duplicate systems');
for (const surface of CTA_SURFACES) {
  const src = read(surface);
  assert(src.includes('settlement-router') || src.includes('settlement-options'), `${path.basename(surface)} → settlement SSOT`);
}
assert(
  !exists('scripts/backfill-marketplace-data-normalization-phase11a.ts'),
  'no duplicate backfill script',
);
assert(
  !exists('lib/marketplace/settlement/settlement-router-v2.ts'),
  'no parallel settlement router',
);
const offerForm = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(offerForm.includes('SettlementConnectGuidance'), 'create/edit: SettlementConnectGuidance');
assert(!offerForm.includes('StripeConnectPaymentsBanner'), 'create/edit: no duplicate Stripe banner');

// --- 11A.4 Filter parity — mobile services category (RC1 fix) ----------------
console.log('\n11A.4 Discovery filter parity');
const mobile = read('components/feed/FeedMobileFilterSheet.tsx');
const sidebar = read('components/feed/FeedSidebarFilters.tsx');
const geo = read('components/feed/GeoFeed.tsx');
assert(
  mobile.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'),
  'mobile filter uses canonical category options',
);
assert(
  sidebar.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'),
  'sidebar uses canonical category options',
);
assert(
  geo.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'),
  'GeoFeed uses canonical category options',
);
assert(mobile.includes("slug !== 'all'") || mobile.includes('slug !== "all"'), 'mobile filter skips all slug');
assert(!mobile.includes('categoryVerticalCheff'), 'mobile filter: no legacy hardcoded categories');
assert(mobile.includes('discoveryDirection'), 'mobile filter: reverse discovery direction');
assert(mobile.includes('AcceptedValuesDiscoveryFilter'), 'mobile filter: accepted values');
assert(mobile.includes('Escape') && mobile.includes('aria-modal'), 'mobile filter: accessible dialog');
assert(sidebar.includes('showTagline'), 'sidebar: USP tagline');

// --- 11A.5 No duplicate mobile detail CTAs ------------------------------------
console.log('\n11A.5 Commerce CTAs — single dominant mobile action');
const commerceZone = read('components/product/detail/ProductSaleCommerceZone.tsx');
assert(!commerceZone.includes('lg:hidden'), 'no mobile inline commerce actions');
assert(commerceZone.includes('hidden lg:block'), 'desktop-only inline primary actions');
assert(read('components/product/detail/ProductSaleStickyCta.tsx').includes('lg:hidden'), 'sticky CTA mobile-only');
assert(
  read('components/product/detail/ProductDetailSettlementSection.tsx').includes('id="detail-settlement"'),
  'settlement scroll target for sticky CTA',
);

// --- 11A.6 Guest / trust / dead-end guards ------------------------------------
console.log('\n11A.6 Guest flows and trust surfaces');
assert(read('components/FansAndFollowsList.tsx').includes('favoritesHub.guestLoginTitle'), 'guest favorites login CTA');
assert(read('app/orders/page.tsx').includes('useTranslation'), 'orders page i18n');
assert(read('components/home/HomeHeroSection.tsx').includes('heroValueExchange'), 'hero value exchange USP');
assert(
  read('components/product/detail/ProductDetailSettlementSection.tsx').includes('ProductDetailSettlementSection'),
  'detail settlement section exists',
);
const sitemap = read('lib/seo/sitemapXml.ts');
assert(sitemap.includes('"/faq"') && sitemap.includes('"/over-ons"'), 'sitemap: faq + over-ons');

// --- 11A.7 Terminology consistency --------------------------------------------
console.log('\n11A.7 Terminology — canonical view axis');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
assert(String(get(nl, 'marketplace.canonical.view.offered')).includes('Aangeboden'), 'NL offered label');
assert(String(get(en, 'marketplace.canonical.view.offered')).toLowerCase().includes('offered'), 'EN offered label');
assert(
  String(get(nl, 'marketplace.detail.settlement.acceptedValues')).includes('Geaccepteerde'),
  'NL accepted values label',
);
assert(
  String(get(en, 'marketplace.detail.settlement.acceptedValues')).includes('Accepted values'),
  'EN accepted values label',
);

// --- 11A.8 i18n parity --------------------------------------------------------
console.log('\n11A.8 Critical i18n keys (NL + EN)');
for (const key of CRITICAL_I18N_KEYS) {
  assert(get(nl, key) != null && String(get(nl, key)).length > 0, `NL: ${key}`);
  assert(get(en, key) != null && String(get(en, key)).length > 0, `EN: ${key}`);
}

// --- 11A.9 Edit settlement prefill (10A regression) ---------------------------
console.log('\n11A.9 Seller edit settlement prefill');
assert(offerForm.includes('resolveSettlementOptions'), 'offer form settlement SSOT prefill');
assert(offerForm.includes('setAcceptHomeCheffPayment'), 'offer form checkout prefill');
assert(read('app/product/[id]/edit/page.tsx').includes('acceptHomeCheffPayment'), 'edit page passes settlement booleans');

// --- 11A.10 Proposal + accepted values pipeline -------------------------------
console.log('\n11A.10 Proposal and accepted-values pipeline');
assert(
  read('components/products/marketplace/AcceptedValuesPicker.tsx').includes('taxonomy-resolve'),
  'accepted values picker uses taxonomy SSOT',
);
assert(
  read('components/chat/proposals/CreateProposalSheet.tsx').includes('aria-modal'),
  'proposal sheet accessible dialog',
);

// --- 11A.11 No hardcoded category lists on filter surfaces --------------------
console.log('\n11A.11 No hardcoded discovery category lists');
assert(!mobile.includes('value="cheff"'), 'mobile filter: no hardcoded cheff option');
assert(!sidebar.includes('value="cheff"'), 'sidebar: no hardcoded cheff option');

// --- 11A.12 Performance / provider guards -------------------------------------
console.log('\n11A.12 Performance guards');
assert(!geo.includes('QueryClientProvider'), 'GeoFeed: no extra provider');

// --- 11A.13 Chained validators (7A–10E) ---------------------------------------
console.log('\n11A.13 Chained validators');
for (const script of PRIOR_VALIDATORS) {
  assert(exists(script), script);
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);

console.log(
  '\nHomeCheff Release Candidate RC1 is approved for the first city pilot.',
);
