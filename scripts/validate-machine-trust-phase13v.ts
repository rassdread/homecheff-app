#!/usr/bin/env npx tsx
/**
 * Phase 13V — Machine Trust, Open Knowledge & AI Agent Readiness guard.
 *
 * Run: npx tsx scripts/validate-machine-trust-phase13v.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { collectSitemapLocUrls } from '../lib/seo/sitemapXml';
import { BLOCKED_PUBLIC_CLAIM_PATTERNS } from '../lib/seo/content-governance';
import {
  OPEN_KNOWLEDGE_DOC_BLOCKS,
  OPEN_KNOWLEDGE_DOC_SLUGS,
  OPEN_KNOWLEDGE_LAST_REVIEWED,
  OPEN_KNOWLEDGE_STANDALONE_PATHS,
  collectOpenKnowledgePublicPaths,
  openKnowledgeDocPath,
} from '../lib/open-knowledge/docs-registry';
import { OPEN_KNOWLEDGE_SOURCES } from '../lib/i18n/openKnowledgeSources';
import { GLOSSARY_TERMS } from '../lib/open-knowledge/glossary-terms';
import { MANIFEST_PATH } from '../lib/seo/homecheff-manifest';

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

const REQUIRED_DOC_KEYS = [
  'metaTitle',
  'metaDescription',
  'title',
  'intro',
  'sectionPurposeTitle',
  'sectionPurposeBody',
  'sectionHowTitle',
  'sectionHowBody',
  'sectionLimitsTitle',
  'sectionLimitsBody',
  'sectionImpactTitle',
  'sectionImpactBody',
  'sectionTruthTitle',
  'sectionTruthBody',
  'faq1Q',
  'faq1A',
  'faq2Q',
  'faq2A',
  'faq3Q',
  'faq3A',
  'lastReviewedLabel',
  'lastReviewedDate',
];

const HYPE_PATTERNS = [
  /disrupt/i,
  /unicorn/i,
  /revolutionary/i,
  /game[- ]?changer/i,
  /guaranteed income/i,
  /gegarandeerd inkomen/i,
  /passive income guaranteed/i,
  /#1 platform/i,
];

function main() {
  console.log('=== Phase 13V — Machine Trust & Open Knowledge ===\n');

  console.log('13V.1 Deliverables');
  assert(exists('docs/audits/MACHINE_TRUST_PHASE13V_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13V_MACHINE_TRUST.md'), 'progress doc');
  assert(exists('scripts/validate-machine-trust-phase13v.ts'), 'validator');

  console.log('\n13V.2 Registry & routes');
  assert(exists('lib/open-knowledge/docs-registry.ts'), 'docs registry');
  assert(exists('lib/i18n/openKnowledgeSources.ts'), 'open knowledge i18n');
  assert(exists('app/docs/page.tsx'), '/docs hub route');
  assert(exists('app/docs/[slug]/page.tsx'), '/docs/[slug] route');
  assert(exists('app/trust/page.tsx'), '/trust route');
  assert(exists('app/changelog/page.tsx'), '/changelog route');
  assert(exists('app/roadmap/page.tsx'), '/roadmap route');
  assert(exists('app/principles/page.tsx'), '/principles route');
  assert(exists('app/ai/page.tsx'), '/ai route');
  assert(exists('app/glossary/page.tsx'), '/glossary route');
  assert(OPEN_KNOWLEDGE_DOC_SLUGS.length === 12, 'twelve topic docs');
  assert(OPEN_KNOWLEDGE_LAST_REVIEWED === '2026-07-11', 'last reviewed SSOT');

  console.log('\n13V.3 Documentation completeness');
  for (const slug of OPEN_KNOWLEDGE_DOC_SLUGS) {
    const blocks = OPEN_KNOWLEDGE_DOC_BLOCKS[slug];
    assert(Array.isArray(blocks) && blocks.length > 0, `blocks for /docs/${slug}`);
    const nsKey = Object.keys(OPEN_KNOWLEDGE_SOURCES).find((k) =>
      read('lib/open-knowledge/docs-registry.ts').includes(`'${slug}'`),
    );
    void nsKey;
    const src = OPEN_KNOWLEDGE_SOURCES[
      slug === 'ranking'
        ? 'openKnowledgeDocRanking'
        : slug === 'business-dna'
          ? 'openKnowledgeDocBusinessDna'
          : slug === 'hcp'
            ? 'openKnowledgeDocHcp'
            : slug === 'affiliate'
              ? 'openKnowledgeDocAffiliate'
              : slug === 'community-orders'
                ? 'openKnowledgeDocCommunityOrders'
                : slug === 'barter'
                  ? 'openKnowledgeDocBarter'
                  : slug === 'delivery'
                    ? 'openKnowledgeDocDelivery'
                    : slug === 'marketplace'
                      ? 'openKnowledgeDocMarketplace'
                      : slug === 'trust'
                        ? 'openKnowledgeDocTrustOps'
                        : slug === 'privacy'
                          ? 'openKnowledgeDocPrivacy'
                          : slug === 'ai'
                            ? 'openKnowledgeDocAi'
                            : 'openKnowledgeDocApi'
    ];
    for (const key of REQUIRED_DOC_KEYS) {
      assert(Boolean(src?.[key]?.nl && src?.[key]?.en), `/docs/${slug} has ${key} NL+EN`);
    }
  }

  console.log('\n13V.4 Standalone pages');
  for (const ns of [
    'openKnowledgeHub',
    'openKnowledgeTrust',
    'openKnowledgeChangelog',
    'openKnowledgeRoadmap',
    'openKnowledgePrinciples',
    'openKnowledgeAiPublic',
    'openKnowledgeGlossary',
  ]) {
    const src = OPEN_KNOWLEDGE_SOURCES[ns];
    assert(Boolean(src?.metaTitle?.nl && src?.metaDescription?.nl), `${ns} meta NL`);
    assert(Boolean(src?.title?.nl && src?.intro?.nl), `${ns} content NL`);
  }

  console.log('\n13V.5 Glossary');
  assert(GLOSSARY_TERMS.length >= 14, 'glossary has >=14 terms');
  for (const term of GLOSSARY_TERMS) {
    const src = OPEN_KNOWLEDGE_SOURCES.openKnowledgeGlossary;
    assert(Boolean(src?.[term.termKey]?.nl), `glossary term ${term.termKey}`);
    assert(Boolean(src?.[term.shortKey]?.nl), `glossary short ${term.shortKey}`);
    assert(Boolean(src?.[term.longKey]?.nl), `glossary long ${term.longKey}`);
  }

  console.log('\n13V.6 Manifest & truth alignment');
  const sourcesBlob = read('lib/i18n/openKnowledgeSources.ts');
  assert(sourcesBlob.includes(MANIFEST_PATH), 'sources link to manifest');
  assert(sourcesBlob.includes('BUSINESS_DISCOVERY_RANKING_WIRED = false'), 'ranking truth: boost not wired');
  assert(sourcesBlob.includes('GET /api/profile/export-data'), 'privacy truth: GDPR export');
  assert(sourcesBlob.includes('Geen publieke write-API'), 'api truth: no public write API');

  for (const pattern of BLOCKED_PUBLIC_CLAIM_PATTERNS) {
    const hit = pattern.test(sourcesBlob);
    assert(!hit, `open knowledge sources avoid blocked claim /${pattern.source}/`);
  }

  console.log('\n13V.7 Schema builders');
  const schema = read('lib/seo/schema-builders.ts');
  assert(schema.includes('buildTechArticleJsonLd'), 'TechArticle builder');
  assert(schema.includes('buildCollectionPageJsonLd'), 'CollectionPage builder');
  assert(schema.includes('buildDefinedTermSetJsonLd'), 'DefinedTermSet builder');
  assert(exists('components/seo/OpenKnowledgeJsonLd.tsx'), 'OpenKnowledgeJsonLd component');

  console.log('\n13V.8 Wiring');
  assert(read('lib/i18n/translations.ts').includes('OPEN_KNOWLEDGE_SOURCES'), 'i18n merge');
  assert(read('lib/seo/buildAuthorityLandingMetadata.ts').includes('OPEN_KNOWLEDGE_SOURCES'), 'metadata');
  assert(read('lib/seo/sitemapXml.ts').includes('collectOpenKnowledgePublicPaths'), 'sitemap');
  assert(read('components/Footer.tsx').includes('/docs'), 'footer docs link');

  const publicPaths = collectOpenKnowledgePublicPaths();
  assert(publicPaths.length === 19, '19 public open-knowledge paths');
  const sitemap = collectSitemapLocUrls();
  for (const p of publicPaths) {
    assert(sitemap.some((u) => u.endsWith(p)), `sitemap includes ${p}`);
  }

  console.log('\n13V.9 Phase 13O / hype scan');
  for (const pattern of HYPE_PATTERNS) {
    assert(!pattern.test(sourcesBlob), `no hype pattern /${pattern.source}/ in sources`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
