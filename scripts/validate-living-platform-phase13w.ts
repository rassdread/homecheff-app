#!/usr/bin/env npx tsx
/**
 * Phase 13W — Living Platform, Evidence Layer & Real-World Authority guard.
 *
 * Run: npx tsx scripts/validate-living-platform-phase13w.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSitemapLocUrls } from '../lib/seo/sitemapXml';
import { BLOCKED_PUBLIC_CLAIM_PATTERNS } from '../lib/seo/content-governance';
import {
  LIVING_PLATFORM_PATHS,
  LIVING_PLATFORM_LAST_REVIEWED,
  PUBLISHED_CASE_STUDIES,
  PLATFORM_TIMELINE,
  TRANSPARENCY_REPORT_SLOTS,
  collectLivingPlatformPublicPaths,
} from '../lib/living-platform/registry';
import { LIVING_PLATFORM_SOURCES } from '../lib/i18n/livingPlatformSources';
import { MANIFEST_PATH } from '../lib/seo/homecheff-manifest';
import { shouldIndexCityHub } from '../lib/seo/city-indexability';

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

const PAGE_NAMESPACES = [
  'livingPlatformEvidence',
  'livingPlatformStatistics',
  'livingPlatformStories',
  'livingPlatformTimeline',
  'livingPlatformReports',
  'livingPlatformHowGrows',
];

function main() {
  console.log('=== Phase 13W — Living Platform & Evidence ===\n');

  console.log('13W.1 Deliverables');
  assert(exists('docs/audits/LIVING_PLATFORM_PHASE13W_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13W_LIVING_PLATFORM.md'), 'progress doc');
  assert(exists('scripts/validate-living-platform-phase13w.ts'), 'validator');

  console.log('\n13W.2 Routes & registry');
  assert(exists('lib/living-platform/registry.ts'), 'registry SSOT');
  assert(exists('lib/living-platform/evidence-queries.ts'), 'evidence queries');
  assert(exists('app/evidence/page.tsx'), '/evidence');
  assert(exists('app/statistics/page.tsx'), '/statistics');
  assert(exists('app/stories/page.tsx'), '/stories');
  assert(exists('app/timeline/page.tsx'), '/timeline');
  assert(exists('app/reports/page.tsx'), '/reports');
  assert(exists('app/how-homecheff-grows/page.tsx'), '/how-homecheff-grows');
  assert(collectLivingPlatformPublicPaths().length === 6, 'six living platform paths');
  assert(LIVING_PLATFORM_LAST_REVIEWED === '2026-07-11', 'last reviewed SSOT');

  console.log('\n13W.3 Evidence & statistics architecture');
  assert(read('lib/living-platform/evidence-queries.ts').includes('getPlatformStatistics'), 'statistics query');
  assert(read('lib/living-platform/evidence-queries.ts').includes('getEvidenceSnapshot'), 'evidence snapshot');
  assert(read('lib/living-platform/evidence-queries.ts').includes('PUBLIC_DATASET_CATALOG'), 'public dataset catalog');
  assert(exists('components/living-platform/EvidenceDashboard.tsx'), 'EvidenceDashboard');
  assert(exists('components/living-platform/StatisticsTable.tsx'), 'StatisticsTable');

  console.log('\n13W.4 Stories, timeline, reports framework');
  assert(PUBLISHED_CASE_STUDIES.length === 0, 'no unpublished fictional stories');
  assert(PLATFORM_TIMELINE.length >= 5, 'timeline events');
  assert(PLATFORM_TIMELINE.some((e) => e.kind === 'planned'), 'planned milestones marked');
  assert(TRANSPARENCY_REPORT_SLOTS.length === 5, 'five report slots');
  assert(TRANSPARENCY_REPORT_SLOTS.every((r) => !r.publishedAt), 'reports initially empty');

  console.log('\n13W.5 i18n completeness');
  for (const ns of PAGE_NAMESPACES) {
    const src = LIVING_PLATFORM_SOURCES[ns];
    assert(Boolean(src?.metaTitle?.nl && src?.metaTitle?.en), `${ns} metaTitle`);
    assert(Boolean(src?.intro?.nl && src?.intro?.en), `${ns} intro`);
    assert(Boolean(src?.lastReviewedDate?.nl), `${ns} lastReviewed`);
  }

  console.log('\n13W.6 Schema & machine readability');
  const schema = read('lib/seo/schema-builders.ts');
  assert(schema.includes('buildDatasetJsonLd'), 'Dataset schema');
  assert(schema.includes('buildItemListJsonLd'), 'ItemList schema');
  assert(exists('components/living-platform/LivingPlatformJsonLd.tsx'), 'LivingPlatformJsonLd');

  console.log('\n13W.7 Authority integration');
  const sources = read('lib/i18n/livingPlatformSources.ts');
  assert(sources.includes(MANIFEST_PATH), 'manifest linked');
  assert(read('lib/living-platform/registry.ts').includes('AUTHORITY_HUB_LINKS'), 'authority hub links');
  assert(read('lib/i18n/translations.ts').includes('LIVING_PLATFORM_SOURCES'), 'i18n merge');
  assert(read('lib/open-knowledge/open-knowledge-blocks.ts').includes('/evidence'), 'docs hub links evidence');
  assert(read('components/Footer.tsx').includes('/evidence'), 'footer evidence link');

  const sitemap = collectSitemapLocUrls();
  for (const p of collectLivingPlatformPublicPaths()) {
    assert(sitemap.some((u) => u.endsWith(p)), `sitemap includes ${p}`);
  }

  console.log('\n13W.8 Truth boundaries (Phase 13O)');
  assert(sources.includes('BUSINESS_DISCOVERY_RANKING_WIRED = false'), 'ranking truth in how-grows');
  assert(!sources.includes('gegarandeerd inkomen'), 'no guaranteed income in living platform copy');
  for (const pattern of BLOCKED_PUBLIC_CLAIM_PATTERNS) {
    assert(!pattern.test(sources), `living platform avoids /${pattern.source}/`);
  }

  console.log('\n13W.9 Sparse city respect');
  assert(typeof shouldIndexCityHub === 'function', 'city indexability guard');
  assert(read('lib/living-platform/evidence-queries.ts').includes('shouldIndexCityHub'), 'evidence uses indexability');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
