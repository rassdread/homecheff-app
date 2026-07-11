#!/usr/bin/env npx tsx
/**
 * Phase 13T — HomeCheff Manifest guard.
 *
 * Run: npx tsx scripts/validate-homecheff-manifest-phase13t.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSitemapLocUrls } from '../lib/seo/sitemapXml';
import { BLOCKED_PUBLIC_CLAIM_PATTERNS } from '../lib/seo/content-governance';
import {
  MANIFEST_CORE_VALUES,
  MANIFEST_IS_NOT,
  MANIFEST_PATH,
  manifestOrganizationDescription,
} from '../lib/seo/homecheff-manifest';
import { getPlatformDefinition } from '../lib/seo/platform-definition';

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

const HYPE_PATTERNS = [
  /disrupt/i,
  /unicorn/i,
  /revolutionary/i,
  /game[- ]?changer/i,
  /world[- ]?class/i,
  /#1 platform/i,
  /beste platform/i,
  /guaranteed income/i,
  /gegarandeerd inkomen/i,
  /founder hero/i,
  /waste reduction (?:proven|measured)/i,
];

function main() {
  console.log('=== Phase 13T — HomeCheff Manifest ===\n');

  console.log('13T.1 Deliverables');
  assert(exists('docs/audits/HOMECHEFF_MANIFEST_PHASE13T_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13T_MANIFEST.md'), 'progress doc');
  assert(exists('scripts/validate-homecheff-manifest-phase13t.ts'), 'validator');

  const audit = read('docs/audits/HOMECHEFF_MANIFEST_PHASE13T_AUDIT.md');
  for (let i = 1; i <= 6; i++) {
    assert(audit.includes(`Part ${i}`), `audit includes Part ${i}`);
  }

  console.log('\n13T.2 Manifest page');
  assert(exists('app/manifest/page.tsx'), 'manifest route');
  assert(exists('lib/seo/homecheff-manifest.ts'), 'manifest SSOT');
  assert(exists('lib/i18n/manifestPageSources.ts'), 'manifest i18n');
  assert(exists('lib/seo/manifest-blocks.ts'), 'manifest blocks');
  assert(MANIFEST_PATH === '/manifest', 'manifest path constant');
  assert(MANIFEST_CORE_VALUES.length === 6, 'six core values');

  const sitemap = collectSitemapLocUrls();
  assert(sitemap.some((u) => u.endsWith('/manifest')), 'manifest in sitemap');

  console.log('\n13T.3 About page expanded');
  const overOns = read('app/over-ons/page.tsx');
  assert(overOns.includes('overOns.storyTitle'), 'about story section');
  assert(overOns.includes('/manifest'), 'about links manifest');
  assert(overOns.includes('overOns.conscienceTitle'), 'about tech conscience');
  assert(overOns.includes('overOns.futureTitle'), 'about future section');

  const nl = read('public/i18n/nl.json');
  const en = read('public/i18n/en.json');
  assert(nl.includes('manifestIntro'), 'NL about manifest intro');
  assert(en.includes('manifestIntro'), 'EN about manifest intro');

  console.log('\n13T.4 Philosophy consistency');
  const platformNl = getPlatformDefinition('nl');
  assert(
    platformNl.organizationDescription.includes('dorpsplein') ||
      platformNl.organizationDescription.includes('village square'),
    'platform definition village square',
  );
  assert(
    manifestOrganizationDescription('nl').includes('dorpsplein'),
    'schema manifest alignment NL',
  );
  assert(read('lib/i18n/translations.ts').includes('MANIFEST_PAGE_SOURCES'), 'i18n merge manifest');

  console.log('\n13T.5 Integration links');
  assert(read('components/Footer.tsx').includes('/manifest'), 'footer manifest link');
  assert(read('lib/seo/pillar-pages.ts').includes('/manifest'), 'pillar manifest link');
  assert(read('lib/seo/ecosystem-map-blocks.ts').includes('/manifest'), 'ecosystem manifest link');
  assert(read('lib/seo/comparison-pages.ts').includes('/manifest'), 'comparison manifest link');
  assert(read('app/faq/page.tsx').includes('/manifest'), 'faq manifest link');

  console.log('\n13T.6 Truth boundaries & tone');
  const manifestI18n = read('lib/i18n/manifestPageSources.ts');
  for (const re of BLOCKED_PUBLIC_CLAIM_PATTERNS) {
    assert(!re.test(manifestI18n), `manifest no blocked claim: ${re}`);
  }
  for (const re of HYPE_PATTERNS) {
    assert(!re.test(manifestI18n), `manifest no hype: ${re}`);
    assert(!re.test(nl.slice(nl.indexOf('"overOns"'), nl.indexOf('"a11y"'))), `about no hype: ${re}`);
  }
  assert(
    !manifestI18n.includes('employer') && !manifestI18n.includes('werkgever'),
    'no dramatic founder employer story in public manifest',
  );
  assert(MANIFEST_IS_NOT.nl.length >= 5, 'what we are not list NL');
  assert(manifestI18n.includes('geen gemeten') || manifestI18n.includes('unproven'), 'society hopes bounded');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
