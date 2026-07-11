#!/usr/bin/env npx tsx
/**
 * Phase 13S — AI Authority P0 Implementation guard.
 *
 * Run: npx tsx scripts/validate-ai-authority-implementation-phase13s.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { COMPARISON_PAGE_REGISTRY } from '../lib/seo/comparison-pages';
import { collectSitemapLocUrls } from '../lib/seo/sitemapXml';
import { CONTENT_GOVERNANCE_RULES, BLOCKED_PUBLIC_CLAIM_PATTERNS } from '../lib/seo/content-governance';
import { shouldIndexCityHub, CITY_INDEX_MIN_ACTIVE_CREATORS } from '../lib/seo/city-indexability';
import {
  WEBSITE_SEARCH_ACTION_TEMPLATE,
  VERIFIED_SAME_AS,
  ORGANIZATION_OMITTED_FIELDS,
  PENDING_SAME_AS_VERIFICATION,
} from '../lib/seo/organization-identity';
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '../lib/seo/schema-builders';

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

const DOMAIN = 'https://homecheff.eu';
const BLOCKED_IN_COMPARISON = [
  /universally better/i,
  /always better/i,
  /altijd beter/i,
  /overal beter/i,
  /discovery[- ]?boost/i,
  /visibility multiplier/i,
  /geavanceerde analytics/i,
  /GDPR export (?:is )?available/i,
];

function main() {
  console.log('=== Phase 13S — AI Authority P0 Implementation ===\n');

  console.log('13S.1 Deliverables');
  assert(exists('docs/audits/AI_AUTHORITY_P0_IMPLEMENTATION_PHASE13S_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13S_AI_AUTHORITY_IMPLEMENTATION.md'), 'progress doc');
  assert(exists('scripts/validate-ai-authority-implementation-phase13s.ts'), 'validator');

  const audit = read('docs/audits/AI_AUTHORITY_P0_IMPLEMENTATION_PHASE13S_AUDIT.md');
  for (let i = 1; i <= 9; i++) {
    assert(audit.includes(`Part ${i}`), `audit includes Part ${i}`);
  }

  console.log('\n13S.2 Comparison routes');
  assert(exists('app/vergelijken/page.tsx'), 'comparison hub');
  assert(exists('app/vergelijken/[slug]/page.tsx'), 'comparison slug route');
  for (const p of COMPARISON_PAGE_REGISTRY) {
    assert(exists(`app/vergelijken/[slug]/page.tsx`), `registry slug ${p.slug}`);
  }

  const comparisonI18n = read('lib/i18n/comparisonPageSources.ts');
  assert(comparisonI18n.includes('comparisonVsEtsy'), 'Etsy comparison content');
  assert(comparisonI18n.includes('comparisonVsMarktplaats'), 'Marktplaats comparison');
  assert(comparisonI18n.includes('comparisonVsFacebook'), 'Facebook comparison');
  assert(comparisonI18n.includes('comparisonVsNextdoor'), 'Nextdoor comparison');
  assert(comparisonI18n.includes('comparisonVsVinted'), 'Vinted comparison');
  assert(comparisonI18n.includes('comparisonVsDelivery'), 'delivery comparison');
  assert(comparisonI18n.includes('lastReviewedDate'), 'last reviewed date');

  for (const re of BLOCKED_IN_COMPARISON) {
    assert(!re.test(comparisonI18n), `no blocked claim pattern: ${re}`);
  }

  console.log('\n13S.3 Ecosystem map');
  assert(exists('app/hoe-homecheff-werkt/page.tsx'), 'ecosystem map route');
  const ecosystem = read('lib/i18n/ecosystemMapSources.ts');
  assert(ecosystem.includes('HCP'), 'HCP explained');
  assert(ecosystem.includes('Business DNA'), 'Business DNA explained');
  assert(/not guaranteed|Niet gegarandeerd/i.test(ecosystem), 'Business DNA limitation clear');
  assert(/not cash|geen geld|geen cash/i.test(ecosystem), 'HCP not cash');

  console.log('\n13S.4 Organization graph SSOT');
  assert(exists('lib/seo/organization-identity.ts'), 'organization-identity.ts');
  assert(exists('components/seo/RootEntityGraphScripts.tsx'), 'RootEntityGraphScripts');
  const layout = read('app/layout.tsx');
  assert(layout.includes('RootEntityGraphScripts'), 'layout includes root entity graph');

  const homeClient = read('components/home/HomePageClient.tsx');
  assert(!homeClient.includes("'@type': 'Organization'"), 'homepage no duplicate Organization');

  const org = buildOrganizationJsonLd(DOMAIN, 'nl');
  const site = buildWebsiteJsonLd(DOMAIN, 'nl');
  assert(org['@id'] === `${DOMAIN}/#organization`, 'Organization @id stable');
  assert(site['@id'] === `${DOMAIN}/#website`, 'WebSite @id stable');
  assert(
    (site.potentialAction as { target?: { urlTemplate?: string } })?.target?.urlTemplate ===
      `${DOMAIN}${WEBSITE_SEARCH_ACTION_TEMPLATE}`,
    'canonical SearchAction template',
  );
  assert(org.legalName === undefined && org.name === 'HomeCheff', 'brand vs legalName split');
  assert(
    (org.parentOrganization as { legalName?: string })?.legalName === 'Arrias Beheer B.V.',
    'legal operator parentOrganization',
  );
  assert(Array.isArray(org.sameAs) && org.sameAs.length >= 2, 'verified sameAs present');
  assert(VERIFIED_SAME_AS.length >= 2, 'sameAs policy documented');
  assert(Object.keys(ORGANIZATION_OMITTED_FIELDS).includes('foundingDate'), 'foundingDate omitted documented');
  assert(PENDING_SAME_AS_VERIFICATION.length >= 1, 'pending sameAs documented');

  console.log('\n13S.5 Food corpus reconciliation');
  assert(exists('components/seo/FoodCategoryContextBlock.tsx'), 'FoodCategoryContextBlock');
  assert(exists('lib/seo/food-context.ts'), 'food-context.ts');
  const seoLanding = read('components/seo/HomecheffSeoLanding.tsx');
  assert(seoLanding.includes('FoodCategoryContextBlock'), 'food SEO landing uses context block');
  const progLanding = read('components/seo/ProgrammaticSeoLandingPage.tsx');
  assert(progLanding.includes('shouldShowFoodCategoryContextForProgrammaticNs'), 'programmatic food context');

  console.log('\n13S.6 Sitemap');
  const sitemap = read('lib/seo/sitemapXml.ts');
  assert(sitemap.includes('/hoe-homecheff-werkt'), 'sitemap ecosystem path');
  assert(sitemap.includes('/vergelijken'), 'sitemap comparison hub');
  assert(sitemap.includes('COMPARISON_PAGE_REGISTRY'), 'sitemap uses comparison registry');

  const urls = collectSitemapLocUrls();
  assert(urls.includes(`${DOMAIN}/hoe-homecheff-werkt`), 'sitemap loc ecosystem');
  assert(urls.includes(`${DOMAIN}/vergelijken`), 'sitemap loc comparison hub');
  for (const p of COMPARISON_PAGE_REGISTRY) {
    assert(urls.includes(`${DOMAIN}${p.path}`), `sitemap loc ${p.path}`);
  }

  console.log('\n13S.7 City noindex intact');
  assert(typeof shouldIndexCityHub === 'function', 'shouldIndexCityHub exists');
  assert(CITY_INDEX_MIN_ACTIVE_CREATORS >= 3, 'city threshold unchanged');
  assert(exists('lib/seo/city-indexability.ts'), 'city-indexability.ts');

  console.log('\n13S.8 Phase 13O blocked claims');
  for (const pattern of BLOCKED_PUBLIC_CLAIM_PATTERNS) {
    assert(!pattern.test(comparisonI18n), `comparison free of ${pattern}`);
    assert(!pattern.test(ecosystem), `ecosystem free of ${pattern}`);
  }
  assert(CONTENT_GOVERNANCE_RULES.length >= 5, 'content governance rules present');

  console.log('\n13S.9 NL/EN parity sources');
  assert(comparisonI18n.includes('en:'), 'comparison EN strings');
  assert(ecosystem.includes('en:'), 'ecosystem EN strings');
  assert(read('lib/i18n/foodCategoryContextSources.ts').includes('en:'), 'food context EN');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
