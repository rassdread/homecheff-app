#!/usr/bin/env npx tsx
/**
 * Phase 13P — Human Craft, Semantic Authority & Mission-Aligned SEO guard.
 *
 * Audit-only: validates deliverables, audit structure, truth-boundary references,
 * and evidence that public SEO surfaces exist for review.
 *
 * Run: npx tsx scripts/validate-human-craft-semantic-authority-phase13p.ts
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

function main() {
  console.log('=== Phase 13P — Human Craft Semantic Authority & SEO ===\n');

  console.log('13P.1 Deliverables');
  assert(
    exists('docs/audits/HUMAN_CRAFT_SEMANTIC_AUTHORITY_PHASE13P_AUDIT.md'),
    'audit doc',
  );
  assert(
    exists('docs/progress/UX_FINALIZATION_PHASE13P_HUMAN_CRAFT_SEO.md'),
    'progress doc',
  );
  assert(
    exists('scripts/validate-human-craft-semantic-authority-phase13p.ts'),
    'validator',
  );

  const audit = read('docs/audits/HUMAN_CRAFT_SEMANTIC_AUTHORITY_PHASE13P_AUDIT.md');

  console.log('\n13P.2 Audit structure (16 parts + verdict)');
  const requiredSections = [
    'Part 1',
    'Part 2',
    'Part 3',
    'Part 4',
    'Part 5',
    'Part 6',
    'Part 7',
    'Part 8',
    'Part 9',
    'Part 10',
    'Part 11',
    'Part 12',
    'Part 13',
    'Part 14',
    'Part 15',
    'Part 16',
    'Final verdict',
    'Opportunity register',
  ];
  for (const section of requiredSections) {
    assert(audit.includes(section), `audit includes ${section}`);
  }

  console.log('\n13P.3 Phase 13O truth boundary referenced');
  assert(audit.includes('Phase 13O') || audit.includes('13O'), 'Phase 13O referenced');
  assert(audit.includes('P0'), 'P0 truth boundaries documented');
  assert(audit.includes('Supported') || audit.includes('Misleading'), 'claim classification');
  assert(
    audit.includes('discovery boost') || audit.includes('discovery ranking'),
    'discovery boost claim audited',
  );
  assert(
    audit.includes('GDPR') || audit.includes('data export'),
    'GDPR export truth boundary',
  );

  console.log('\n13P.4 Human-craft semantic clusters');
  const craftTerms = [
    'personal craftsmanship',
    'extra income',
    'social cohesion',
    'mass production',
    'neighbour',
    'handmade',
    'local entrepreneurship',
  ];
  for (const term of craftTerms) {
    assert(audit.toLowerCase().includes(term.toLowerCase()), `audit covers ${term}`);
  }

  console.log('\n13P.5 Pilot geography');
  assert(audit.includes('Vlaardingen'), 'Vlaardingen audited');
  assert(audit.includes('Rotterdam'), 'Rotterdam audited');
  assert(
    audit.includes('Schiedam') || audit.includes('Rijnmond'),
    'Rijnmond cluster audited',
  );

  console.log('\n13P.6 SEO infrastructure evidence');
  assert(exists('lib/seo/homecheffSeoPages.data.ts'), 'SEO page definitions');
  assert(exists('lib/seo/sitemapXml.ts'), 'sitemap builder');
  assert(exists('lib/seo/faqStructuredData.ts'), 'FAQ JSON-LD');
  assert(exists('lib/seo/localCities.ts'), 'local city registry');
  assert(exists('components/home/HomePageClient.tsx'), 'homepage structured data');
  assert(exists('app/product/[id]/layout.tsx'), 'product JSON-LD');
  assert(exists('lib/marketplace/taxonomy.ts'), 'taxonomy (mass-production boundaries)');

  const seoData = read('lib/seo/homecheffSeoPages.data.ts');
  assert(seoData.includes('verkopen-huis'), 'sell-from-home SEO page exists');
  assert(seoData.includes('lokale-producten'), 'local products SEO page exists');

  const localCities = read('lib/seo/localCities.ts');
  assert(localCities.includes("slug: 'vlaardingen'"), 'pilot city in local SEO registry');

  const faqLd = read('lib/seo/faqStructuredData.ts');
  assert(
    faqLd.includes('vakmanschap') || faqLd.includes('craft'),
    'FAQ JSON-LD broad craft positioning',
  );

  const taxonomy = read('lib/marketplace/taxonomy.ts');
  assert(taxonomy.includes("blockedItem('dropshipping')"), 'dropshipping blocked in taxonomy');

  console.log('\n13P.7 Opportunity register priorities');
  assert(audit.includes('P0 —') || audit.includes('P0—') || audit.includes('| P0'), 'P0 opportunities');
  assert(audit.includes('P1 —') || audit.includes('P1—') || audit.includes('| P1'), 'P1 opportunities');
  assert(audit.includes('P2 —') || audit.includes('P2—') || audit.includes('| P2'), 'P2 opportunities');
  assert(audit.includes('P3 —') || audit.includes('P3—') || audit.includes('| P3'), 'P3 opportunities');

  console.log('\n13P.8 Content governance');
  assert(
    audit.includes('Content governance') || audit.includes('governance'),
    'content governance section',
  );
  assert(
    audit.includes('thin') || audit.includes('doorway'),
    'anti-spam SEO rules documented',
  );

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
