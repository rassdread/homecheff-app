#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 10B — Pilot polish & UX consistency guard.
 *
 * Verifies Phase 10A P2 fixes, terminology/settlement consistency,
 * accessibility polish, no duplicate CTAs/Stripe guidance, architecture
 * unchanged, and chains Phase 10A + prior validators.
 *
 * Run: npx tsx scripts/validate-pilot-polish-phase10b.ts
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

const PRIOR_VALIDATORS = [
  'scripts/validate-pilot-launch-readiness-phase10a.ts',
  'scripts/validate-brand-implementation-phase9b.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-marketplace-value-economy-phase8d.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
  'scripts/validate-settlement-options-phase7c.ts',
];

console.log('=== UX-FIN Phase 10B — Pilot polish ===\n');

// --- 10B.1 Deliverables -------------------------------------------------------
console.log('10B.1 Deliverables');
assert(exists('docs/audits/PILOT_POLISH_PHASE10B_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE10B_PILOT_POLISH.md'), 'progress doc');
assert(exists('scripts/validate-pilot-polish-phase10b.ts'), 'validator script');

// --- 10B.2 Architecture unchanged ---------------------------------------------
console.log('\n10B.2 Architecture unchanged');
for (const f of [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
]) {
  assert(exists(f), f);
}
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 10B'), 'no 10B stamp in canonical-model');

// --- 10B.3 No duplicate mobile detail CTAs ------------------------------------
console.log('\n10B.3 Mobile detail CTAs');
const commerceZone = read('components/product/detail/ProductSaleCommerceZone.tsx');
assert(!commerceZone.includes('lg:hidden'), 'no mobile inline commerce actions');
assert(commerceZone.includes('hidden lg:block'), 'desktop-only inline primary actions');
assert(read('components/product/detail/ProductSaleStickyCta.tsx').includes('lg:hidden'), 'sticky CTA mobile-only');
assert(
  read('components/product/detail/ProductDetailSettlementSection.tsx').includes('id="detail-settlement"'),
  'mobile scroll target for sticky CTA',
);

// --- 10B.4 No duplicate Stripe Connect guidance -------------------------------
console.log('\n10B.4 Stripe Connect — single guidance');
const offerForm = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(offerForm.includes('SettlementConnectGuidance'), 'form: SettlementConnectGuidance');
assert(!offerForm.includes('StripeConnectPaymentsBanner'), 'form: no duplicate banner');
assert(!read('app/product/[id]/edit/page.tsx').includes('StripeConnectPaymentsBanner'), 'edit: no banner');
assert(!read('app/sell/new/page.tsx').includes('StripeConnectPaymentsBanner'), 'sell/new: no banner');

// --- 10B.5 Guest favorites login CTA ------------------------------------------
console.log('\n10B.5 Guest favorites');
const fansList = read('components/FansAndFollowsList.tsx');
assert(fansList.includes('useSession'), 'FansAndFollowsList: session check');
assert(fansList.includes('favoritesHub.guestLoginTitle'), 'guest favorites login panel');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const key of ['favoritesHub.guestLoginTitle', 'favoritesHub.guestLoginCta']) {
  assert(String(get(nl, key)).length > 3, `NL ${key}`);
  assert(String(get(en, key)).length > 3, `EN ${key}`);
}

// --- 10B.6 Terminology — View axis --------------------------------------------
console.log('\n10B.6 Terminology (View axis)');
assert(String(get(nl, 'feed.chipSale')) === 'Aangeboden', 'NL chipSale → Aangeboden');
assert(String(get(en, 'feed.chipSale')) === 'Offered', 'EN chipSale → Offered');
assert(String(get(nl, 'feed.saleViewOffer')) === 'Aangeboden', 'NL saleViewOffer');
const discoverFallback = read('components/discover/DiscoverHubClient.tsx');
assert(!discoverFallback.includes('te koop op het dorpsplein'), 'discover hub: no te koop fallback');

// --- 10B.7 Settlement wording — Accepted values --------------------------------
console.log('\n10B.7 Settlement wording');
assert(
  String(get(nl, 'marketplace.detail.settlement.acceptedValues')) === 'Geaccepteerde waarden',
  'NL settlement: Geaccepteerde waarden',
);
assert(
  String(get(en, 'marketplace.detail.settlement.acceptedValues')) === 'Accepted values',
  'EN settlement: Accepted values',
);
assert(
  !String(get(nl, 'marketplace.detail.settlement.acceptedValues')).includes('Alternatieve'),
  'NL: no Alternatieve in settlement label',
);
assert(
  !String(get(en, 'marketplace.detail.settlement.acceptedValues')).includes('Alternative'),
  'EN: no Alternative in settlement label',
);

// --- 10B.8 Accessibility polish ----------------------------------------------
console.log('\n10B.8 Accessibility');
assert(read('components/navigation/BottomNavigation.tsx').includes('<nav'), 'bottom nav: nav element');
assert(read('components/navigation/BottomNavigation.tsx').includes('mainNavAria'), 'bottom nav: aria-label key');
assert(read('components/feed/FeedMobileFilterSheet.tsx').includes('Escape'), 'filter sheet: escape handler');
assert(read('components/feed/FeedMobileFilterSheet.tsx').includes('aria-modal'), 'filter sheet: dialog semantics');

// --- 10B.9 SEO polish ----------------------------------------------------------
console.log('\n10B.9 SEO');
const sitemap = read('lib/seo/sitemapXml.ts');
assert(sitemap.includes('"/faq"') && sitemap.includes('"/over-ons"'), 'sitemap: faq + over-ons');
const gemeenschap = read('app/gemeenschap/[segment]/page.tsx');
assert(gemeenschap.includes('resolvePageLanguage'), 'gemeenschap: locale-aware metadata');

// --- 10B.10 CTA router preserved -----------------------------------------------
console.log('\n10B.10 CTA router');
assert(
  read('components/product/detail/ProductSaleStickyCta.tsx').includes('settlement-router'),
  'sticky CTA → settlement-router',
);

// --- 10B.11 Performance guards ------------------------------------------------
console.log('\n10B.11 Performance');
assert(!read('components/feed/GeoFeed.tsx').includes('QueryClientProvider'), 'GeoFeed: no extra provider');

// --- 10B.12 Prior validators ---------------------------------------------------
console.log('\n10B.12 Chained validators');
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
