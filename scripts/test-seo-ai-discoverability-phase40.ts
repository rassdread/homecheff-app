/**
 * SEO 4.0 — AI discoverability + entity graph unit checks (no network).
 * Run: npx tsx scripts/test-seo-ai-discoverability-phase40.ts
 */
import assert from 'node:assert/strict';
import { LLMS_TXT, LLMS_FULL_TXT, AI_TXT } from '../lib/seo/ai-machine-briefs';
import {
  organizationEntityId,
  websiteEntityId,
  legalOperatorEntityId,
  platformEntityId,
  VERIFIED_SAME_AS,
} from '../lib/seo/organization-identity';
import { buildRootEntityGraphJsonLd } from '../lib/seo/schema-builders';
import { ENTITY_NODES, entityGraphBrief } from '../lib/seo/entity-graph';
import { SEO_CORE_NODES, SEO_OUTBOUND } from '../lib/seo/internal-link-graph';
import robots from '../app/robots';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

test('llms.txt is plain text with HomeCheff identity', () => {
  assert.ok(LLMS_TXT.startsWith('# HomeCheff'));
  assert.ok(!LLMS_TXT.includes('<!DOCTYPE'));
  assert.ok(LLMS_TXT.includes('https://homecheff.eu'));
  assert.ok(LLMS_TXT.includes('Arrias Beheer B.V.'));
  assert.ok(LLMS_TXT.includes('HomeGarden'));
  assert.ok(LLMS_TXT.includes('HomeDesigner'));
  assert.ok(!LLMS_TXT.includes('/checkout'));
  assert.ok(!LLMS_TXT.includes('/dashboard'));
});

test('llms-full expands without HTML', () => {
  assert.ok(LLMS_FULL_TXT.includes('expanded machine brief'));
  assert.ok(!LLMS_FULL_TXT.includes('<html'));
  assert.ok(LLMS_FULL_TXT.includes('pickup → buyer drop-off'));
});

test('ai.txt is distinct agent brief', () => {
  assert.ok(AI_TXT.includes('platform: HomeCheff'));
  assert.ok(AI_TXT.includes('entity_id: https://homecheff.eu/#organization'));
  assert.ok(AI_TXT.includes('platform_id: https://homecheff.eu/#platform'));
});

test('stable entity IDs', () => {
  const d = 'https://homecheff.eu';
  assert.equal(organizationEntityId(d), 'https://homecheff.eu/#organization');
  assert.equal(websiteEntityId(d), 'https://homecheff.eu/#website');
  assert.equal(legalOperatorEntityId(d), 'https://homecheff.eu/#legal-operator');
  assert.equal(platformEntityId(d), 'https://homecheff.eu/#platform');
  assert.equal(ENTITY_NODES.brand.schemaId, organizationEntityId(d));
});

test('root JSON-LD graph is consistent and parseable', () => {
  const graph = buildRootEntityGraphJsonLd('https://homecheff.eu', 'nl');
  assert.equal(graph.length, 4);
  const ids = graph.map((n) => n['@id']);
  assert.deepEqual(ids, [
    'https://homecheff.eu/#organization',
    'https://homecheff.eu/#legal-operator',
    'https://homecheff.eu/#website',
    'https://homecheff.eu/#platform',
  ]);
  for (const node of graph) {
    JSON.parse(JSON.stringify(node));
  }
  assert.ok(VERIFIED_SAME_AS.includes('https://homecheff.eu'));
  assert.ok(entityGraphBrief().includes('verticals:'));
});

test('robots disallows private chrome and allows AI agents', () => {
  const r = robots();
  assert.equal(r.sitemap, 'https://homecheff.eu/sitemap.xml');
  assert.equal(r.host, 'https://homecheff.eu');
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const star = rules.find((x) => x?.userAgent === '*');
  assert.ok(star);
  assert.ok((star!.disallow as string[]).includes('/checkout/'));
  assert.ok((star!.disallow as string[]).includes('/api/'));
  assert.ok(rules.some((x) => x?.userAgent === 'GPTBot'));
  assert.ok(rules.some((x) => x?.userAgent === 'ClaudeBot'));
});

test('internal link graph has no private paths', () => {
  for (const n of SEO_CORE_NODES) {
    assert.ok(!n.path.includes('/checkout'));
    assert.ok(!n.path.includes('/dashboard'));
  }
  for (const outs of Object.values(SEO_OUTBOUND)) {
    for (const p of outs) {
      assert.ok(p.startsWith('/'));
    }
  }
});

console.log('\nSEO 4.0 AI discoverability tests done.');
