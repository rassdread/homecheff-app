#!/usr/bin/env npx tsx
/**
 * Phase 13Q — Human Craft Authority & Mission Implementation guard.
 *
 * Run: npx tsx scripts/validate-human-craft-implementation-phase13q.ts
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
  console.log('=== Phase 13Q — Human Craft Implementation ===\n');

  console.log('13Q.1 Deliverables');
  assert(exists('docs/audits/HUMAN_CRAFT_IMPLEMENTATION_PHASE13Q_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13Q_IMPLEMENTATION.md'), 'progress doc');
  assert(exists('scripts/validate-human-craft-implementation-phase13q.ts'), 'validator');

  const audit = read('docs/audits/HUMAN_CRAFT_IMPLEMENTATION_PHASE13Q_AUDIT.md');

  console.log('\n13Q.2 Implementation parts');
  for (let i = 1; i <= 11; i++) {
    assert(audit.includes(`Part ${i}`), `audit includes Part ${i}`);
  }
  assert(audit.includes('Final consistency'), 'consistency audit section');
  assert(audit.includes('Phase 13O'), 'Phase 13O truth boundary');
  assert(audit.includes('Phase 13P'), 'Phase 13P reference');

  console.log('\n13Q.3 Platform definition SSOT');
  assert(exists('lib/seo/platform-definition.ts'), 'platform-definition.ts');
  const platform = read('lib/seo/platform-definition.ts');
  assert(platform.includes('persoonlijk vakmanschap'), 'NL craft identity');
  assert(platform.includes('personal craftsmanship'), 'EN craft identity');

  console.log('\n13Q.4 Pillar pages');
  for (const p of PILLAR_PATHS) {
    const slug = p.slice(1);
    assert(exists(`app/${slug}/page.tsx`), `route ${p}`);
  }
  assert(exists('lib/seo/pillar-pages.ts'), 'pillar registry');
  assert(exists('lib/i18n/pillarPageSources.ts'), 'pillar i18n sources');

  const sitemap = read('lib/seo/sitemapXml.ts');
  for (const p of PILLAR_PATHS) {
    assert(sitemap.includes(`"${p}"`), `sitemap includes ${p}`);
  }

  console.log('\n13Q.5 Schema improvements');
  assert(exists('lib/seo/schema-builders.ts'), 'schema-builders.ts');
  const schema = read('lib/seo/schema-builders.ts');
  assert(schema.includes('ProfilePage'), 'ProfilePage builder');
  assert(schema.includes("'Service'"), 'Service schema');
  assert(schema.includes('HowTo'), 'HowTo builder');
  assert(schema.includes('SearchAction'), 'SearchAction in WebSite');

  const productLayout = read('app/product/[id]/layout.tsx');
  assert(productLayout.includes('buildListingJsonLd'), 'product uses listing schema builder');

  const profilePage = read('app/user/[username]/page.tsx');
  assert(profilePage.includes('buildProfilePageJsonLd'), 'profile uses ProfilePage');

  console.log('\n13Q.6 City noindex thresholds');
  assert(exists('lib/seo/city-indexability.ts'), 'city-indexability.ts');
  const cityPage = read('app/maaltijden/[stad]/page.tsx');
  assert(cityPage.includes('shouldIndexCityHub'), 'city metadata uses threshold');

  console.log('\n13Q.7 Truth claim softening');
  const nl = read('public/i18n/nl.json');
  const en = read('public/i18n/en.json');
  assert(
    !nl.includes('discovery-boost in de buurt') && !en.includes('local discovery boost'),
    'discovery boost marketing removed',
  );
  assert(
    nl.includes('nog uitgerold') || nl.includes('wordt nog uitgerold'),
    'GDPR export honesty NL',
  );
  assert(
    en.includes('still being rolled out') || en.includes('being rolled out'),
    'GDPR export honesty EN',
  );

  console.log('\n13Q.8 Content governance');
  assert(exists('lib/seo/content-governance.ts'), 'content-governance.ts');
  assert(read('lib/seo/content-governance.ts').includes('CONTENT_GOVERNANCE_RULES'), 'governance rules');

  console.log('\n13Q.9 SEO hub pillar section');
  const hub = read('components/seo/HomecheffSeoHub.tsx');
  assert(hub.includes('getPillarHubSection'), 'SEO hub links pillars');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
