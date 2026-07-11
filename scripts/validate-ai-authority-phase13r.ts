#!/usr/bin/env npx tsx
/**
 * Phase 13R — AI Authority, Generative Search & Knowledge Graph guard.
 *
 * Run: npx tsx scripts/validate-ai-authority-phase13r.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildOrganizationJsonLd } from '../lib/seo/schema-builders';

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

const PILLAR_PATHS = [
  '/wat-is-homecheff',
  '/lokaal-verdienen',
  '/ontmoet-de-maker',
  '/persoonlijk-vakmanschap',
  '/buurthulp',
  '/buurt-economie',
  '/wat-we-niet-zijn',
];

function main() {
  console.log('=== Phase 13R — AI Authority ===\n');

  console.log('13R.1 Deliverables');
  assert(exists('docs/audits/AI_AUTHORITY_PHASE13R_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13R_AI_AUTHORITY.md'), 'progress doc');
  assert(exists('scripts/validate-ai-authority-phase13r.ts'), 'validator');

  const audit = read('docs/audits/AI_AUTHORITY_PHASE13R_AUDIT.md');
  const progress = read('docs/progress/UX_FINALIZATION_PHASE13R_AI_AUTHORITY.md');

  console.log('\n13R.2 Audit structure (10 parts)');
  for (let i = 1; i <= 10; i++) {
    assert(audit.includes(`Part ${i}`), `audit includes Part ${i}`);
  }
  assert(audit.includes('Opportunity register'), 'opportunity register');
  assert(audit.includes('Phase 13O'), 'Phase 13O truth boundary');
  assert(audit.includes('Phase 13Q'), 'Phase 13Q reference');
  assert(audit.includes('P0'), 'P0 gaps ranked');
  assert(audit.includes('P1'), 'P1 gaps ranked');

  console.log('\n13R.3 Progress doc');
  assert(progress.includes('13N'), 'progress references 13N boundary');
  assert(progress.includes('Audit complete'), 'audit marked complete');
  assert(progress.includes('13R-01'), 'top opportunity 13R-01');

  console.log('\n13R.4 Platform SSOT (13Q foundation)');
  assert(exists('lib/seo/platform-definition.ts'), 'platform-definition.ts');
  const platform = read('lib/seo/platform-definition.ts');
  assert(platform.includes('entityDefinition'), 'entityDefinition field');
  assert(platform.includes('persoonlijk vakmanschap'), 'NL craft identity');

  console.log('\n13R.5 Schema infrastructure');
  assert(exists('lib/seo/schema-builders.ts'), 'schema-builders.ts');
  const schema = read('lib/seo/schema-builders.ts');
  assert(schema.includes('buildOrganizationJsonLd'), 'Organization builder');
  assert(schema.includes('buildProfilePageJsonLd'), 'ProfilePage builder');
  assert(schema.includes('buildListingJsonLd'), 'Product/Service builder');
  assert(schema.includes('buildSellerHowToJsonLd'), 'HowTo builder');
  assert(exists('lib/seo/faqStructuredData.ts'), 'faqStructuredData.ts');

  console.log('\n13R.6 Knowledge graph gap documentation');
  assert(audit.includes('sameAs'), 'audit documents sameAs gap');
  assert(audit.includes('legalName'), 'audit documents legalName gap');
  assert(audit.includes('foundingDate'), 'audit documents foundingDate gap');
  assert(audit.includes('foundingLocation'), 'audit documents foundingLocation gap');

  console.log('\n13R.7 Generative search question coverage');
  const gsoQuestions = [
    'What is HomeCheff?',
    'Can I earn money?',
    'Can I barter?',
    'personal craftsmanship',
    'Etsy',
    'Marktplaats',
    'Uber Eats',
  ];
  for (const q of gsoQuestions) {
    assert(audit.includes(q), `audit covers GSO: ${q}`);
  }

  console.log('\n13R.8 Pillar layer (readiness, not re-implementation)');
  for (const p of PILLAR_PATHS) {
    const slug = p.slice(1);
    assert(exists(`app/${slug}/page.tsx`), `pillar route ${p}`);
  }

  console.log('\n13R.9 Evidence: no dedicated competitor comparison pages');
  const seoData = read('lib/seo/homecheffSeoPages.data.ts');
  const pillarSources = read('lib/i18n/pillarPageSources.ts');
  const dedicatedCompetitorSlug = /(?:id|nlSlug|enSlug).*(?:etsy|marktplaats|nextdoor|vinted|facebook-marketplace)/i;
  assert(
    !dedicatedCompetitorSlug.test(seoData),
    'no competitor-specific SEO slugs (audit finding)',
  );
  assert(
    !/(?:vs\.?|versus|alternatief-voor-(?:etsy|marktplaats|nextdoor|vinted))/i.test(
      seoData + pillarSources,
    ),
    'no dedicated competitor comparison copy in pillars/SEO defs',
  );

  console.log('\n13R.10 Organization schema (post-13S enrichment)');
  const orgIdentity = read('lib/seo/organization-identity.ts');
  assert(orgIdentity.includes('VERIFIED_SAME_AS'), 'verified sameAs policy');
  assert(orgIdentity.includes('LEGAL_OPERATOR'), 'legal operator documented');
  const builtOrg = JSON.stringify(buildOrganizationJsonLd('https://homecheff.eu', 'nl'));
  assert(builtOrg.includes('sameAs'), 'Organization JSON-LD includes sameAs');
  assert(builtOrg.includes('Arrias Beheer'), 'Organization JSON-LD includes legal operator');

  console.log('\n13R.11 Evidence: legal entity in About copy');
  const nlJson = read('public/i18n/nl.json');
  assert(nlJson.includes('Arrias Beheer B.V.'), 'About i18n has legal name');
  assert(nlJson.includes('80532829'), 'About i18n has KvK');

  console.log('\n13R.12 Evidence: schema SSOT (post-13S: root layout, not homepage inline)');
  assert(exists('components/seo/RootEntityGraphScripts.tsx'), 'RootEntityGraphScripts (13S)');
  const layout = read('app/layout.tsx');
  assert(layout.includes('RootEntityGraphScripts'), 'layout wires entity graph');
  assert(exists('lib/seo/organization-identity.ts'), 'organization-identity.ts (13S)');

  console.log('\n13R.13 Sitemap corpus references');
  assert(audit.includes('88'), 'audit cites sitemap URL count');
  assert(exists('lib/seo/sitemapXml.ts'), 'sitemapXml.ts');

  console.log('\n13R.14 Local AI discovery scenarios');
  const scenarios = ['Vlaardingen', 'gardener', 'homemade food', 'barter', 'guitar'];
  for (const s of scenarios) {
    assert(audit.includes(s) || audit.toLowerCase().includes(s.toLowerCase()), `audit scenario: ${s}`);
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
