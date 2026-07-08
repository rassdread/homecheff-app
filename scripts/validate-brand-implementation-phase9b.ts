#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 9B — Brand implementation guard.
 *
 * Run: npx tsx scripts/validate-brand-implementation-phase9b.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

const MEAL_ONLY_BRAND = [
  /maaltijdsite/i,
  /meal platform/i,
  /recipe website/i,
  /food delivery app/i,
  /kookplatform/i,
];

console.log('=== UX-FIN Phase 9B — Brand implementation ===\n');

// --- 9B.1 Deliverables -------------------------------------------------------
console.log('9B.1 Deliverables');
assert(exists('docs/brand/HOMECHEFF_BRAND_LANGUAGE.md'), 'brand language doc');
assert(exists('docs/audits/BRAND_IMPLEMENTATION_PHASE9B_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE9B_BRAND_IMPLEMENTATION.md'), 'progress doc');

// --- 9B.2 Brand language SSOT ------------------------------------------------
console.log('\n9B.2 Brand language document');
const brand = read('docs/brand/HOMECHEFF_BRAND_LANGUAGE.md');
assert(brand.includes('local craft, exchange and community platform'), 'EN elevator pitch');
assert(brand.includes('vakmanschap, creativiteit en hulp'), 'NL long positioning');
assert(brand.includes('What HomeCheff IS NOT'), 'is-not section');
assert(brand.includes('marketplace.canonical.view.offered'), 'canonical terminology');

// --- 9B.3 Primary surfaces — meal-only removed -------------------------------
console.log('\n9B.3 Primary surfaces aligned');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
const faq0nl = String(get(nl, 'faq.general.0.answer') ?? '');
const faq0en = String(get(en, 'faq.general.0.answer') ?? '');
assert(/diensten|services/i.test(faq0nl) && /ruil|barter|waarde/i.test(faq0nl), 'nl FAQ opener: services + exchange');
assert(/services/i.test(faq0en) && /barter|value/i.test(faq0en), 'en FAQ opener: services + exchange');
assert(!/voedselverspilling|food waste/i.test(faq0nl), 'nl FAQ: not food-waste mission opener');
assert(!/food waste/i.test(faq0en), 'en FAQ: not food-waste mission opener');

const orgNl = String(get(nl, 'home.schemaOrganizationDescription') ?? '');
const orgEn = String(get(en, 'home.schemaOrganizationDescription') ?? '');
assert(/waarde-uitwisseling|community/i.test(orgNl), 'nl Organization description broad');
assert(/value exchange|community/i.test(orgEn), 'en Organization description broad');
assert(!MEAL_ONLY_BRAND.some((re) => re.test(orgNl)), 'nl org: no meal-only brand');

const manifest = read('public/manifest.json');
assert(!manifest.includes('Thuisgebracht'), 'manifest: no delivery-only tagline');
assert(manifest.includes('diensten') || manifest.includes('gezocht'), 'manifest: multi-category NL');

// --- 9B.4 About & discover terminology ---------------------------------------
console.log('\n9B.4 About & canonical terminology');
assert(String(get(nl, 'overOns.whoWeAre1')).includes('één categorie'), 'nl about: food one category');
assert(String(get(en, 'overOns.whoWeAre1')).includes('one category'), 'en about: food one category');
assert(String(get(nl, 'discover.hubSubtitle')).includes('aangeboden'), 'discover hub: offered not te koop');
assert(String(get(en, 'discover.hubSubtitle')).includes('offered'), 'discover hub EN: offered');
assert(!String(get(en, 'sell.freeBody')).includes('Gezocht'), 'en sell.freeBody: no Dutch Gezocht leak');

// --- 9B.5 Onboarding i18n ----------------------------------------------------
console.log('\n9B.5 Onboarding');
const buyer = read('app/onboarding/buyer/page.tsx');
const seller = read('app/onboarding/seller/page.tsx');
assert(buyer.includes('onboardingBranch') && buyer.includes('useTranslation'), 'buyer onboarding i18n');
assert(seller.includes('onboardingBranch') && seller.includes('categoryServices'), 'seller onboarding ecosystem');
assert(!seller.includes('Start met je eerste gerecht'), 'seller: no meal-first hardcoded');

// --- 9B.6 SEO hub & local pages ----------------------------------------------
console.log('\n9B.6 SEO hub & local SEO');
const hubSections = read('lib/seo/homecheffSeoPages.ts');
assert(hubSections.includes('Lokaal ontdekken') || hubSections.includes('discover-local'), 'seo hub: discover-first section');
assert(!hubSections.includes('titleNl: "Eten kopen"'), 'seo hub: not food-only first section');
const seoHubMeta = read('app/seo-hub/page.tsx');
assert(seoHubMeta.includes('diensten') || seoHubMeta.includes('creaties'), 'seo hub meta broad');
const cityPage = read('app/maaltijden/[stad]/page.tsx');
assert(cityPage.includes('Lokaal aanbod'), 'city page: broad title (URL preserved)');
assert(cityPage.includes('/maaltijden/'), 'city page: URL backward compatible');

// --- 9B.7 Structured data ----------------------------------------------------
console.log('\n9B.7 Structured data');
const faqLd = read('lib/seo/faqStructuredData.ts');
assert(faqLd.includes('value exchange') || faqLd.includes('waarde-uitwisseling'), 'FAQ JSON-LD broad');
assert(faqLd.includes('services') || faqLd.includes('diensten'), 'FAQ JSON-LD services');

// --- 9B.8 Internal linking ---------------------------------------------------
console.log('\n9B.8 Internal linking');
const seoHubUi = read('components/seo/HomecheffSeoHub.tsx');
assert(seoHubUi.includes('/gemeenschap/tuin') && seoHubUi.includes('/faq'), 'seo hub ecosystem + faq links');
assert(seoHubUi.includes('chip=gezocht'), 'seo hub wanted link');

// --- 9B.9 Architecture non-regression ----------------------------------------
console.log('\n9B.9 Marketplace architecture unchanged');
assert(exists('lib/marketplace/canonical-model.ts'), 'canonical-model');
assert(read('components/product/detail/ProductSalePrimaryActions.tsx').includes('settlement-router'), '8E settlement router');
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 9B'), 'no 9B arch changes in canonical-model');

// --- 9B.10 NL/EN parity new keys ---------------------------------------------
console.log('\n9B.10 NL/EN parity');
for (const key of [
  'onboardingBranch.buyerTitle',
  'onboardingBranch.categoryServices',
  'home.schemaOrganizationDescription',
  'homePhase1.schemaWebsiteDescription',
]) {
  assert(typeof get(nl, key) === 'string' && String(get(nl, key)).length > 5, `NL: ${key}`);
  assert(typeof get(en, key) === 'string' && String(get(en, key)).length > 5, `EN: ${key}`);
}

// --- 9B.11 Success page i18n -------------------------------------------------
console.log('\n9B.11 Legacy success page');
const success = read('app/success/page.tsx');
assert(success.includes('useTranslation') && success.includes('paymentSuccess'), 'success page i18n');
assert(!success.includes('Betaling succesvol!'), 'success: no hardcoded NL title');

// --- 9B.12 Prior validators --------------------------------------------------
console.log('\n9B.12 Prior phase guards');
for (const s of [
  'scripts/validate-brand-positioning-phase9a.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
]) {
  assert(exists(s), s);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
