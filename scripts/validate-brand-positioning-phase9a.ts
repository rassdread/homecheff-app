#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 9A — Brand positioning, SEO & content architecture guard.
 *
 * Audit-first: guards primary brand surfaces + canonical IA; documents known SEO
 * debt in the audit. Does NOT require long-tail meal SEO pages to be removed.
 *
 * Run: npx tsx scripts/validate-brand-positioning-phase9a.ts
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

const MEAL_ONLY_BRAND_PATTERNS = [
  /maaltijdsite/i,
  /meal delivery app/i,
  /food delivery app/i,
  /receptenplatform/i,
  /recipe platform/i,
  /kookplatform/i,
];

console.log('=== UX-FIN Phase 9A — Brand positioning & SEO guard ===\n');

// --- 9A.1 Deliverables -------------------------------------------------------
console.log('9A.1 Deliverables');
assert(exists('docs/audits/BRAND_POSITIONING_SEO_PHASE9A_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE9A_BRAND_POSITIONING.md'), 'progress doc');

// --- 9A.2 Core positioning on primary surfaces -------------------------------
console.log('\n9A.2 Primary brand surfaces (not meal-only)');
const layout = read('app/layout.tsx');
assert(
  layout.includes('Digitale Ateliers, Tuinen en Keukens') &&
    layout.includes('Digital Studios, Gardens and Kitchens'),
  'root layout titles: ateliers/tuinen/keukens + studios/gardens/kitchens',
);
assert(
  !MEAL_ONLY_BRAND_PATTERNS.some((re) => re.test(layout)),
  'root layout: no meal-only brand patterns',
);

const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
const heroDefNl = String(get(nl, 'homePhase1.heroDefinition') ?? '');
const heroDefEn = String(get(en, 'homePhase1.heroDefinition') ?? '');
assert(
  /diensten|hulp/.test(heroDefNl) && /ruil|afspreken/.test(heroDefNl),
  'nl heroDefinition: services/help + exchange/agreements',
);
assert(
  /services|help/i.test(heroDefEn) && /trade|exchange|barter|agree/i.test(heroDefEn),
  'en heroDefinition: services/help + exchange',
);
assert(
  !/maaltijdsite|kookplatform|receptenplatform/i.test(heroDefNl),
  'nl heroDefinition: not positioned as meals/recipe/cook site',
);

// --- 9A.3 Canonical terminology (Phase 7D) ---------------------------------
console.log('\n9A.3 Canonical marketplace terminology');
assert(exists('lib/marketplace/canonical-model.ts'), 'canonical-model present');
const canonical = read('lib/marketplace/canonical-model.ts');
assert(canonical.includes('MARKETPLACE_VIEW_INTENT_LABEL_KEYS'), 'view intent label keys');
assert(canonical.includes('marketplace.canonical.view.offered'), 'offered canonical key');
assert(canonical.includes('marketplace.canonical.category.services'), 'services canonical key');
assert(canonical.includes('SETTLEMENT'), 'settlement axis documented as follow-up only');

const canonicalKeys = [
  'marketplace.canonical.view.all',
  'marketplace.canonical.view.offered',
  'marketplace.canonical.view.wanted',
  'marketplace.canonical.view.inspiration',
  'marketplace.canonical.category.food',
  'marketplace.canonical.category.garden',
  'marketplace.canonical.category.creations',
  'marketplace.canonical.category.services',
];
for (const key of canonicalKeys) {
  assert(typeof get(nl, key) === 'string' && String(get(nl, key)).length > 0, `NL: ${key}`);
  assert(typeof get(en, key) === 'string' && String(get(en, key)).length > 0, `EN: ${key}`);
}
assert(get(nl, 'marketplace.canonical.view.offered') === 'Aangeboden', 'nl offered = Aangeboden');
assert(get(en, 'marketplace.canonical.view.offered') === 'Offered', 'en offered = Offered');
assert(get(nl, 'marketplace.canonical.view.wanted') === 'Gezocht', 'nl wanted = Gezocht');
assert(get(en, 'marketplace.canonical.view.wanted') === 'Wanted', 'en wanted = Wanted');

// --- 9A.4 UI wires canonical view chips --------------------------------------
console.log('\n9A.4 Discovery UI uses canonical labels');
const geo = read('components/feed/GeoFeed.tsx');
assert(geo.includes('DISCOVERY_VIEW_CHIP_OPTIONS'), 'GeoFeed view chip options');
assert(geo.includes('marketplace.canonical.view.offered'), 'Gezocht empty → offered canonical');
assert(!geo.includes("t('feed.chipSale')"), 'GeoFeed does not use feed.chipSale as primary chip');

const sidebar = read('lib/home/home-desktop-sidebar-ia.ts');
assert(sidebar.includes('marketplace.canonical.category.food'), 'sidebar food canonical');
assert(sidebar.includes('marketplace.canonical.view.wanted'), 'sidebar wanted canonical');

// --- 9A.5 Value economy & settlement (no regression) -------------------------
console.log('\n9A.5 Marketplace architecture unchanged (8E guard)');
assert(exists('lib/marketplace/settlement/settlement-router.ts'), 'settlement-router intact');
const primary = read('components/product/detail/ProductSalePrimaryActions.tsx');
assert(
  primary.includes('resolveMarketplaceCtaActions') && primary.includes('settlement-router'),
  'primary CTA still uses settlement-router',
);

// --- 9A.6 SEO infrastructure -------------------------------------------------
console.log('\n9A.6 SEO infrastructure');
assert(exists('app/robots.ts'), 'robots.ts');
assert(exists('app/sitemap.xml/route.ts') || exists('app/sitemap.ts'), 'sitemap route');
assert(read('app/robots.ts').includes('sitemap'), 'robots references sitemap');
assert(exists('lib/seo/constants.ts'), 'seo constants');
assert(read('lib/seo/constants.ts').includes('homecheff.eu'), 'canonical domain .eu');

const sitemap = read('lib/seo/sitemapXml.ts');
assert(sitemap.includes('gemeenschap'), 'sitemap includes ecosystem pages');
assert(sitemap.includes('seo-hub'), 'sitemap includes seo hub');

// --- 9A.7 Structured data breadth --------------------------------------------
console.log('\n9A.7 Structured data (broader than meals-only)');
const faqLd = read('lib/seo/faqStructuredData.ts');
assert(faqLd.includes('value exchange') || faqLd.includes('waarde-uitwisseling'), 'FAQ schema: value exchange');
assert(faqLd.includes('services') || faqLd.includes('diensten'), 'FAQ schema: services');
assert(faqLd.includes('garden') || faqLd.includes('tuin'), 'FAQ schema: garden');

const productLayout = read('app/product/[id]/layout.tsx');
assert(productLayout.includes('application/ld+json'), 'product page JSON-LD');

const gemeenschap = read('app/gemeenschap/[segment]/page.tsx');
assert(gemeenschap.includes('application/ld+json') || gemeenschap.includes('generateMetadata'),
  'ecosystem pages have metadata/schema');

// --- 9A.8 Ecosystem & multi-vertical SEO pages --------------------------------
console.log('\n9A.8 Multi-vertical SEO surfaces exist');
assert(exists('app/gemeenschap/[segment]/page.tsx'), 'gemeenschap ecosystem route');
assert(
  read('lib/community/categoryEcosystemSlugs.ts').includes('tuin') ||
    read('lib/seo/sitemapXml.ts').includes('tuin'),
  'tuin ecosystem in sitemap/slugs',
);
const seoData = read('lib/seo/homecheffSeoPages.data.ts');
assert(seoData.includes('lokale-producten'), 'seo pages include local products (multi-category)');

// --- 9A.9 Primary surfaces must not use worst meal-only titles -----------------
console.log('\n9A.9 Primary titles avoid meal-only positioning');
assert(
  !/HomeCheff - .*[Mm]aaltijd/.test(layout),
  'root layout default title is not meal-branded',
);
const dorpspleinLayout = read('app/dorpsplein/layout.tsx');
if (dorpspleinLayout.length > 0) {
  assert(
    !/maaltijdsite|meal marketplace/i.test(dorpspleinLayout),
    'dorpsplein layout: not meal marketplace',
  );
}

// --- 9A.10 NL/EN parity on brand keys ----------------------------------------
console.log('\n9A.10 NL/EN parity (brand + canonical)');
const brandKeys = [
  'homePhase1.heroDefinition',
  'homePhase1.howItWorksStep1',
  'homePhase1.howItWorksStep2',
  'homePhase1.howItWorksStep3',
  'feed.chipSectionIntro',
  'marketplace.discovery.requests.emptyBody',
];
for (const key of brandKeys) {
  assert(typeof get(nl, key) === 'string' && String(get(nl, key)).length > 10, `NL brand: ${key}`);
  assert(typeof get(en, key) === 'string' && String(get(en, key)).length > 10, `EN brand: ${key}`);
}

// --- 9A.11 Known debt documented (audit inventory) ---------------------------
console.log('\n9A.11 Known SEO debt documented in audit');
const audit = read('docs/audits/BRAND_POSITIONING_SEO_PHASE9A_AUDIT.md');
const debtMarkers = [
  'manifest.json',
  'maaltijden',
  'faq.general',
  'schemaOrganizationDescription',
  'Phase 9B',
  'te koop',
];
for (const marker of debtMarkers) {
  assert(audit.includes(marker), `audit documents: ${marker}`);
}

// --- 9A.12 Manifest positioning (9B aligned) -----------------------------------
console.log('\n9A.12 Manifest positioning');
const manifest = read('public/manifest.json');
assert(!manifest.includes('Thuisgebracht'), 'manifest: no delivery-only tagline');
assert(
  manifest.includes('dorpsplein') || manifest.includes('diensten') || manifest.includes('gezocht'),
  'manifest: multi-category description',
);

// --- 9A.13 Performance / no extra fetch ----------------------------------------
console.log('\n9A.13 No performance regression guards');
assert(!/fetch\(|prisma\./.test(canonical), 'canonical-model: sync only');

// --- 9A.14 Prior phase validators still present -------------------------------
console.log('\n9A.14 Prior phase guards present');
for (const script of [
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-marketplace-value-economy-phase8d.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
  'scripts/validate-settlement-options-phase7c.ts',
]) {
  assert(exists(script), script);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
