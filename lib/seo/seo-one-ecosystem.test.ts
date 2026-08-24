/**
 * SEO 1 — entity graph + parent-domain ecosystem landings.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERIFIED_SAME_AS } from '@/lib/seo/organization-identity';
import { buildRootEntityGraphJsonLd } from '@/lib/seo/schema-builders';
import { ECOSYSTEM_ENTITY_IDS } from '@/lib/seo/ecosystem-participation';
import { ENTITY_KNOWLEDGE_SURFACES } from '@/lib/seo/entity-graph';

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

describe('SEO 1 ecosystem entity + landings', () => {
  it('parent landings exist and are not redirected away', () => {
    assert.match(read('app/ecosystem/page.tsx'), /EcosystemParticipationLanding/);
    assert.match(read('app/studio/page.tsx'), /variant="studio"/);
    assert.match(read('app/growth/page.tsx'), /variant="growth"/);
    const nextConfig = read('next.config.mjs');
    assert.doesNotMatch(
      nextConfig,
      /source:\s*'\/growth'[\s\S]*growth\.homecheff\.eu/,
    );
  });

  it('LEGAL-0 and sitemap include ecosystem routes', () => {
    const known = read('lib/seo/known-root-path-segments.ts');
    assert.match(known, /'ecosystem'/);
    assert.match(known, /'studio'/);
    assert.match(known, /'growth'/);
    const sitemap = read('lib/seo/sitemapXml.ts');
    assert.match(sitemap, /"\/ecosystem"/);
    assert.match(sitemap, /"\/studio"/);
    assert.match(sitemap, /"\/growth"/);
  });

  it('root entity graph connects Marketplace, Studio, Growth and Affiliate', () => {
    const graph = buildRootEntityGraphJsonLd('https://homecheff.eu', 'nl');
    const ids = graph.map((n) => n['@id']);
    assert.ok(ids.includes(ECOSYSTEM_ENTITY_IDS.organization));
    assert.ok(ids.includes(ECOSYSTEM_ENTITY_IDS.marketplace));
    assert.ok(ids.includes(ECOSYSTEM_ENTITY_IDS.studioApp));
    assert.ok(ids.includes(ECOSYSTEM_ENTITY_IDS.growthApp));
    assert.ok(ids.includes(ECOSYSTEM_ENTITY_IDS.affiliate));
  });

  it('sameAs inventory is verified-only and includes LinkedIn company', () => {
    assert.ok(VERIFIED_SAME_AS.includes('https://homecheff.eu'));
    assert.ok(VERIFIED_SAME_AS.includes('https://www.linkedin.com/company/homecheff'));
    assert.ok(!VERIFIED_SAME_AS.some((u) => /sergio/i.test(u)));
  });

  it('knowledge surfaces include ecosystem landings', () => {
    assert.ok(ENTITY_KNOWLEDGE_SURFACES.includes('/ecosystem'));
    assert.ok(ENTITY_KNOWLEDGE_SURFACES.includes('/studio'));
    assert.ok(ENTITY_KNOWLEDGE_SURFACES.includes('/growth'));
    assert.ok(ENTITY_KNOWLEDGE_SURFACES.includes('/affiliate'));
  });

  it('homepage SSR exposes ecosystem participation signal', () => {
    assert.match(read('app/page.tsx'), /HomepageEcosystemSignal/);
    assert.match(
      read('components/seo/HomepageEcosystemSignal.tsx'),
      /Iedereen eet mee|Everyone gets a seat/,
    );
  });

  it('AI briefs describe the ecosystem layers', () => {
    const briefs = read('lib/seo/ai-machine-briefs.ts');
    assert.match(briefs, /homecheff\.eu\/ecosystem/);
    assert.match(briefs, /CREATE → SELL → GROW → PROMOTE → EARN → REPEAT/);
    assert.match(briefs, /Arrias Beheer B\.V\./);
  });
});
