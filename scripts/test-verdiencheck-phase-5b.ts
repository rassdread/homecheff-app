/**
 * VerdienCheck Fase 5B — public integration prep + legacy copy cleanup.
 *
 *   npx tsx scripts/test-verdiencheck-phase-5b.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicCtaEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { verdiencheckPageMetadata } from '../lib/verdiencheck/public-seo';
import { BOTTOM_NAV_HIDDEN_PATH_PREFIXES } from '../lib/bottomNavRoutes';
import { findForbiddenPublicCopy } from '../lib/verdiencheck/public-copy-patterns';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

assert.equal(isVerdienCheckEnabled(), false);
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(isVerdienCheckPublicCtaEnabled(), false);

const meta = verdiencheckPageMetadata();
assert.deepEqual(meta.robots, { index: false, follow: false });

const sitemapSrc = read('lib/seo/sitemapXml.ts');
assert.doesNotMatch(sitemapSrc, /verdiencheck/i);

assert.ok(BOTTOM_NAV_HIDDEN_PATH_PREFIXES.includes('/verdiencheck'));

const page = read('app/verdiencheck/page.tsx');
assert.match(page, /verdiencheckPageMetadata/);
assert.match(page, /isVerdienCheckPublicRouteVisible/);

const entry = read('components/verdiencheck/VerdienCheckPublicEntry.tsx');
assert.match(entry, /isVerdienCheckPublicCtaEnabled/);
assert.match(entry, /Doe de VerdienCheck/);

const wizard = read('components/verdiencheck/VerdienCheckWizard.tsx');
assert.match(wizard, /data-verdiencheck-shell/);
assert.match(wizard, /z-\[80\]/);

const nl = read('public/i18n/nl.json');
assert.doesNotMatch(nl, /BTW-plichtig vanaf €20\.000/);
assert.doesNotMatch(nl, /Wajong: 70%/);
assert.doesNotMatch(nl, /1-5 porties/);
assert.doesNotMatch(nl, /onder de radar te blijven van voedselinspectie/);
assert.match(nl, /Er bestaat geen algemene HomeCheff-grens waaronder inkomsten automatisch belastingvrij zijn/);
assert.match(
  nl,
  /HomeCheff kan wettelijk verplicht zijn bepaalde verkoopgegevens te rapporteren\. Dat betekent niet automatisch dat je belasting moet betalen/,
);
assert.match(nl, /Verkoop je meerdere keren per jaar eten of drinken\? Dan wordt NVWA-registratie relevant/);

const en = read('public/i18n/en.json');
assert.doesNotMatch(en, /VAT-liable from €20,000/);
assert.doesNotMatch(en, /Wajong: 70%/);
assert.doesNotMatch(en, /1-5 portions/);

const faqHits = [
  ...findForbiddenPublicCopy('public/i18n/nl.json', nl),
  ...findForbiddenPublicCopy('public/i18n/en.json', en),
];
assert.equal(faqHits.length, 0, JSON.stringify(faqHits, null, 2));

const faqPage = read('app/faq/page.tsx');
assert.match(faqPage, /Meer uitleg|More detail|split\(\/\\n---\\n\/\)/);

console.log('verdiencheck phase 5B tests: PASS');
