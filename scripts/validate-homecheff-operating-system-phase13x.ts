#!/usr/bin/env npx tsx
/**
 * Phase 13X — HomeCheff Operating System & Governance guard.
 *
 * Run: npx tsx scripts/validate-homecheff-operating-system-phase13x.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSitemapLocUrls } from '../lib/seo/sitemapXml';
import { BLOCKED_PUBLIC_CLAIM_PATTERNS } from '../lib/seo/content-governance';
import {
  AI_CHARTER_ALLOWED,
  AI_CHARTER_FORBIDDEN,
  CONSTITUTION_NAMESPACE,
  CONSTITUTION_PATH,
  DECISION_FRAMEWORK_STRENGTHENS,
  FEATURE_ACCEPTANCE_CRITERIA,
  FEATURE_REJECT_EXAMPLES,
  GROWTH_CHARTER_ACCEPT,
  GROWTH_CHARTER_REJECT,
  INVESTMENT_PRINCIPLE_QUESTIONS,
  MANIFEST_PATH,
  MODERATION_PRINCIPLE_KEYS,
  OPERATING_SYSTEM_LAST_REVIEWED,
  operatingSystemStructuralCounts,
} from '../lib/governance/homecheff-operating-system';
import { CONSTITUTION_BLOCKS } from '../lib/governance/operating-system-blocks';
import { OPERATING_SYSTEM_PAGE_SOURCES } from '../lib/i18n/operatingSystemSources';

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
  /guaranteed income/i,
  /gegarandeerd inkomen/i,
  /founder hero/i,
  /#1 platform/i,
];

const REQUIRED_SECTIONS = [
  'sectionConstitutionTitle',
  'sectionDecisionTitle',
  'sectionFeatureTitle',
  'sectionModerationTitle',
  'sectionAiCharterTitle',
  'sectionGrowthTitle',
  'sectionInvestmentTitle',
  'sectionGovernanceTitle',
  'sectionCultureTitle',
  'sectionFuture25Title',
];

function main() {
  console.log('=== Phase 13X — HomeCheff Operating System ===\n');

  console.log('13X.1 Deliverables');
  assert(exists('docs/audits/HOMECHEFF_OPERATING_SYSTEM_PHASE13X_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13X_OPERATING_SYSTEM.md'), 'progress doc');
  assert(exists('scripts/validate-homecheff-operating-system-phase13x.ts'), 'validator');

  console.log('\n13X.2 Constitution route');
  assert(exists('app/constitution/page.tsx'), '/constitution route');
  assert(exists('lib/governance/homecheff-operating-system.ts'), 'OS SSOT');
  assert(exists('lib/governance/operating-system-blocks.ts'), 'constitution blocks');
  assert(exists('lib/i18n/operatingSystemSources.ts'), 'constitution i18n');
  assert(CONSTITUTION_PATH === '/constitution', 'constitution path');
  assert(CONSTITUTION_NAMESPACE === 'constitutionPage', 'constitution namespace');
  assert(CONSTITUTION_BLOCKS.length >= 15, 'constitution blocks comprehensive');

  console.log('\n13X.3 Operating System SSOT structure');
  const counts = operatingSystemStructuralCounts();
  assert(DECISION_FRAMEWORK_STRENGTHENS.length === 7, 'seven decision pillars');
  assert(FEATURE_ACCEPTANCE_CRITERIA.length === 6, 'six feature criteria');
  assert(FEATURE_REJECT_EXAMPLES.length === 7, 'seven reject examples');
  assert(AI_CHARTER_ALLOWED.length === 5, 'five AI allowed uses');
  assert(AI_CHARTER_FORBIDDEN.length === 5, 'five AI forbidden uses');
  assert(GROWTH_CHARTER_REJECT.length === 6, 'six growth reject patterns');
  assert(GROWTH_CHARTER_ACCEPT.length === 6, 'six growth accept patterns');
  assert(INVESTMENT_PRINCIPLE_QUESTIONS.length === 4, 'four investment questions');
  assert(MODERATION_PRINCIPLE_KEYS.length === 7, 'seven moderation principles');
  assert(counts.futureAspirations === 6, 'six future aspirations');
  assert(OPERATING_SYSTEM_LAST_REVIEWED === '2026-07-11', 'last reviewed');

  console.log('\n13X.4 Constitution content');
  const page = OPERATING_SYSTEM_PAGE_SOURCES.constitutionPage;
  for (const key of REQUIRED_SECTIONS) {
    assert(Boolean(page?.[key]?.nl && page?.[key]?.en), `constitution has ${key} NL+EN`);
  }
  assert(Boolean(page?.faq1Q?.nl), 'constitution FAQ');
  assert(page?.sectionFuture25Body?.nl?.includes('Aspirationeel') || page?.sectionFuture25Body?.nl?.includes('geen voorspelling'), '25y marked aspirational NL');

  console.log('\n13X.5 Integration');
  assert(read('lib/i18n/translations.ts').includes('OPERATING_SYSTEM_PAGE_SOURCES'), 'i18n merge');
  assert(read('lib/seo/buildAuthorityLandingMetadata.ts').includes('OPERATING_SYSTEM_PAGE_SOURCES'), 'metadata');
  assert(read('components/Footer.tsx').includes('/constitution'), 'footer constitution');
  assert(read('lib/seo/manifest-blocks.ts').includes('/constitution'), 'manifest links constitution');
  assert(read('lib/open-knowledge/open-knowledge-blocks.ts').includes('/constitution'), 'docs hub links constitution');
  assert(read('lib/living-platform/registry.ts').includes('/constitution'), 'authority hub constitution');
  assert(read('components/seo/HomecheffSeoHub.tsx').includes('/constitution'), 'seo hub constitution');

  const sitemap = collectSitemapLocUrls();
  assert(sitemap.some((u) => u.endsWith('/constitution')), 'constitution in sitemap');

  console.log('\n13X.6 Manifest references');
  const osSrc = read('lib/i18n/operatingSystemSources.ts');
  assert(osSrc.includes(MANIFEST_PATH), 'constitution references manifest');
  assert(read('lib/governance/homecheff-operating-system.ts').includes('MANIFEST_MISSION'), 'SSOT imports manifest mission');

  console.log('\n13X.7 Truth boundaries');
  for (const pattern of BLOCKED_PUBLIC_CLAIM_PATTERNS) {
    assert(!pattern.test(osSrc), `constitution avoids /${pattern.source}/`);
  }
  for (const pattern of HYPE_PATTERNS) {
    assert(!pattern.test(osSrc), `no hype /${pattern.source}/`);
  }
  assert(!osSrc.includes('gegarandeerd inkomen'), 'no guaranteed income');
  assert(osSrc.includes('Phase 13O'), 'Phase 13O referenced');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
