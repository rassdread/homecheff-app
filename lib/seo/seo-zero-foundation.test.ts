/**
 * SEO 0 — marketplace sitemap hygiene, product sitemap, listing schema safety.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

describe('SEO 0 marketplace foundation', () => {
  it('static sitemap does not unconditionally include /maaltijden city hubs', () => {
    const source = read('lib/seo/sitemapXml.ts');
    assert.doesNotMatch(
      source,
      /for \(const c of LOCAL_SEO_CITIES\)[\s\S]*push\(`\/maaltijden/,
    );
    assert.match(source, /collectSitemapLocUrlsAsync/);
    assert.match(source, /shouldIndexCityHub/);
  });

  it('sync collectSitemapLocUrls keeps city hubs out of static export', () => {
    const source = read('lib/seo/sitemapXml.ts');
    const fnStart = source.indexOf('export function collectSitemapLocUrls()');
    const fnEnd = source.indexOf('export async function collectSitemapLocUrlsAsync');
    assert.ok(fnStart >= 0 && fnEnd > fnStart);
    const body = source.slice(fnStart, fnEnd);
    assert.doesNotMatch(body, /\/maaltijden\//);
  });

  it('robots references main and product sitemaps', () => {
    const robots = read('app/robots.ts');
    assert.match(robots, /sitemap\.xml/);
    assert.match(robots, /sitemap-products\.xml/);
  });

  it('sitemap-products route uses public listing eligibility helper', () => {
    const route = read('app/sitemap-products.xml/route.ts');
    assert.match(route, /collectPublicListingSitemapEntries/);
    const helper = read('lib/seo/public-listing-sitemap.ts');
    assert.match(helper, /productIntegrityPublicWhere/);
    assert.match(helper, /isActive:\s*true/);
    assert.match(helper, /suspendedAt:\s*null/);
    assert.match(helper, /accountDeletedAt:\s*null/);
  });

  it('LEGAL-0 known segments allow sitemap-products.xml through middleware', () => {
    const known = read('lib/seo/known-root-path-segments.ts');
    assert.match(known, /'sitemap-products\.xml'/);
    assert.match(known, /'sitemap\.xml'/);
  });

  it('listing schema omits misleading Offer price for on-request models', () => {
    const schema = read('lib/seo/schema-builders.ts');
    assert.match(schema, /listingOfferHasPublicPrice/);
    assert.match(schema, /ON_REQUEST|VOLUNTARY/);
  });

  it('product detail page exposes SSR h1 and layout uses buildListingJsonLd', () => {
    const page = read('app/product/[id]/page.tsx');
    assert.match(page, /<h1/);
    const layout = read('app/product/[id]/layout.tsx');
    assert.match(layout, /buildListingJsonLd/);
  });
});
