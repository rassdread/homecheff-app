/**
 * LEGAL-0 integrity: static Terms/Privacy dates + known-root 404 allowlist.
 *
 *   npx tsx scripts/validate-legal-0-integrity.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  LEGAL_DOCUMENTS,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_VERSION,
} from '../lib/legal/document-versions';
import { formatLegalEffectiveDate } from '../lib/legal/format-legal-effective-date';
import {
  APP_FIRST_SEGMENTS,
  EN_APP_FIRST_SEGMENTS,
  isKnownHomecheffRootPath,
} from '../lib/seo/known-root-path-segments';
import { HOMECHEFF_SEO_PAGE_DEFS } from '../lib/seo/homecheffSeoPages.data';
import { EN_SEO_PAGE_SLUGS, NL_SEO_PAGE_SLUGS } from '../lib/seo/homecheffSeoPageSlugs';
import { NOT_FOUND_METADATA } from '../lib/seo/not-found-metadata';
import { rethrowIfNotFound } from '../lib/seo/rethrow-if-not-found';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// --- A. Static legal dates ---
assert.equal(TERMS_VERSION, '1.1');
assert.equal(PRIVACY_VERSION, '1.0');
assert.equal(TERMS_EFFECTIVE_DATE, '2026-08-15');
assert.equal(PRIVACY_EFFECTIVE_DATE, '2026-08-14');
assert.equal(LEGAL_DOCUMENTS.terms.effectiveDate, TERMS_EFFECTIVE_DATE);
assert.equal(LEGAL_DOCUMENTS.privacy.effectiveDate, PRIVACY_EFFECTIVE_DATE);

const RealDate = Date;
const FakeDate = class extends RealDate {
  constructor(...args: never[]) {
    if (args.length === 0) {
      super('2026-08-16T12:00:00.000Z');
      return;
    }
    super(...(args as []));
  }
  static now() {
    return Date.parse('2026-08-16T12:00:00.000Z');
  }
} as unknown as DateConstructor;
// @ts-expect-error test double
globalThis.Date = FakeDate;
assert.equal(LEGAL_DOCUMENTS.terms.effectiveDate, '2026-08-15');
assert.equal(LEGAL_DOCUMENTS.privacy.effectiveDate, '2026-08-14');
assert.equal(formatLegalEffectiveDate('2026-08-15', 'nl'), '15 augustus 2026');
assert.equal(formatLegalEffectiveDate('2026-08-15', 'en'), '15 August 2026');
globalThis.Date = RealDate;

assert.equal(formatLegalEffectiveDate(TERMS_EFFECTIVE_DATE, 'nl'), '15 augustus 2026');
assert.equal(formatLegalEffectiveDate(TERMS_EFFECTIVE_DATE, 'en'), '15 August 2026');

const termsSrc = read('app/terms/page.tsx');
const privacySrc = read('app/privacy/page.tsx');
assert.equal(termsSrc.includes('new Date()'), false);
assert.equal(privacySrc.includes('new Date()'), false);
assert.match(termsSrc, /LegalDocumentVersionStamp/);
assert.match(privacySrc, /LegalDocumentVersionStamp/);

const safetySrc = read('app/safety/page.tsx');
const guidelinesSrc = read('app/community-guidelines/page.tsx');
assert.equal(safetySrc.includes('new Date()'), false);
assert.equal(guidelinesSrc.includes('new Date()'), false);

// --- B. Known-root allowlist vs filesystem ---
const appDir = path.join(ROOT, 'app');
const skipDirNames = new Set(['[seoSlug]', 'eten-verkopen-[stad]', 'api']);
const fsSegments = fs
  .readdirSync(appDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !skipDirNames.has(d.name))
  .map((d) => d.name)
  .sort();
const listed = [...APP_FIRST_SEGMENTS].sort();
assert.deepEqual(
  fsSegments,
  listed,
  `APP_FIRST_SEGMENTS drifted from app/*.\nonly on disk: ${fsSegments.filter((s) => !listed.includes(s)).join(', ')}\nonly in list: ${listed.filter((s) => !fsSegments.includes(s)).join(', ')}`,
);

const enDir = path.join(appDir, 'en');
const enFs = fs
  .readdirSync(enDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== '[seoSlug]')
  .map((d) => d.name)
  .sort();
assert.deepEqual(enFs, [...EN_APP_FIRST_SEGMENTS].sort());

assert.equal(isKnownHomecheffRootPath('/'), true);
assert.equal(isKnownHomecheffRootPath('/terms'), true);
assert.equal(isKnownHomecheffRootPath('/privacy/'), true);
assert.equal(isKnownHomecheffRootPath('/over-ons'), true);
assert.equal(isKnownHomecheffRootPath('/faq'), true);
assert.equal(isKnownHomecheffRootPath('/product/anything'), true);
assert.equal(isKnownHomecheffRootPath('/user/anyone'), true);
assert.equal(isKnownHomecheffRootPath('/recipe/x'), true);
assert.equal(isKnownHomecheffRootPath('/eten-verkopen-rotterdam'), true);
assert.equal(isKnownHomecheffRootPath('/this-slug-does-not-exist-legal0-xyz'), false);
assert.equal(isKnownHomecheffRootPath('/en/this-en-slug-does-not-exist-legal0'), false);
assert.equal(isKnownHomecheffRootPath('/en/seo-hub'), true);
assert.equal(isKnownHomecheffRootPath('/logo.png'), true);
assert.equal(isKnownHomecheffRootPath('/homecheff-globeman.png'), true);
assert.equal(isKnownHomecheffRootPath('/og-brand.png'), true);
assert.equal(isKnownHomecheffRootPath('/avatar-placeholder.png'), true);
assert.equal(isKnownHomecheffRootPath('/brand/homecheff-logo-primary.png'), true);
assert.equal(isKnownHomecheffRootPath('/icon-192.png'), true);
assert.equal(isKnownHomecheffRootPath('/this-slug-does-not-exist-legal0-xyz.png'), true);
assert.equal(isKnownHomecheffRootPath('/unknown-dir/file.png'), false);

assert.equal(NOT_FOUND_METADATA.robots && typeof NOT_FOUND_METADATA.robots === 'object' && !Array.isArray(NOT_FOUND_METADATA.robots) && NOT_FOUND_METADATA.robots.index, false);
assert.equal(
  NOT_FOUND_METADATA.alternates &&
    typeof NOT_FOUND_METADATA.alternates === 'object' &&
    NOT_FOUND_METADATA.alternates.canonical === null,
  true,
);

const notFoundErr = Object.assign(new Error('NEXT_NOT_FOUND'), {
  digest: 'NEXT_NOT_FOUND',
});
assert.throws(() => rethrowIfNotFound(notFoundErr));
rethrowIfNotFound(new Error('other'));

const productLayout = read('app/product/[id]/layout.tsx');
assert.match(productLayout, /rethrowIfNotFound/);
assert.match(productLayout, /if \(!product\) notFound\(\)/);
assert.match(read('middleware.ts'), /entity-exists/);
assert.match(read('lib/seo/entity-exists-for-http-404.ts'), /entityExistsForHttp404/);

// SP.2D-C7 — slim slug module must match SEO page defs (middleware must not load page copy).
assert.deepEqual(
  [...NL_SEO_PAGE_SLUGS],
  HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.nlSlug),
);
assert.deepEqual(
  [...EN_SEO_PAGE_SLUGS],
  HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.enSlug),
);
assert.doesNotMatch(read('lib/seo/known-root-path-segments.ts'), /homecheffSeoPages\.data/);

console.log('LEGAL-0 integrity tests passed');
