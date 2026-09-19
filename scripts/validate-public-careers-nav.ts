#!/usr/bin/env npx tsx
/**
 * Static guard: public Careers/Werken-bij discovery is always in the header
 * (logged in and logged out). NL family stays /werken-bij…; EN family is /careers…
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CAREERS_EN_PATHS,
  CAREERS_NL_PATHS,
  PUBLIC_CAREERS_PATH,
  PUBLIC_EARN_HUB_PATH,
  careersHreflangLanguages,
  careersPath,
  mapCareersPathForLanguage,
} from '../lib/navigation/public-careers-nav';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

const nav = read('components/NavBar.tsx');
const nl = JSON.parse(read('public/i18n/nl.json')) as {
  navbar: Record<string, string>;
};
const en = JSON.parse(read('public/i18n/en.json')) as {
  navbar: Record<string, string>;
};
const werkenPage = read('app/werken-bij/page.tsx');
const werkenLayout = read('app/werken-bij/layout.tsx');
const careersPage = read('app/careers/page.tsx');
const careersLayout = read('app/careers/layout.tsx');
const affiliateDash = read('app/affiliate/dashboard/page.tsx');
const sellerDash = read('app/verkoper/dashboard/page.tsx');
const deliveryDash = read('app/delivery/dashboard/page.tsx');
const i18nHook = read('hooks/useTranslation.ts');

assert.equal(PUBLIC_CAREERS_PATH, '/werken-bij');
assert.equal(PUBLIC_EARN_HUB_PATH, '/werken-bij');
assert.equal(CAREERS_NL_PATHS.hub, '/werken-bij');
assert.equal(CAREERS_NL_PATHS.jobs, '/werken-bij/vacatures');
assert.equal(CAREERS_NL_PATHS.howItWorks, '/werken-bij/hoe-werkt-het');
assert.equal(CAREERS_EN_PATHS.hub, '/careers');
assert.equal(CAREERS_EN_PATHS.jobs, '/careers/jobs');
assert.equal(CAREERS_EN_PATHS.howItWorks, '/careers/how-it-works');

assert.equal(careersPath('hub', 'nl'), '/werken-bij');
assert.equal(careersPath('hub', 'en'), '/careers');
assert.equal(careersPath('jobs', 'nl'), '/werken-bij/vacatures');
assert.equal(careersPath('jobs', 'en'), '/careers/jobs');
assert.equal(careersPath('howItWorks', 'nl'), '/werken-bij/hoe-werkt-het');
assert.equal(careersPath('howItWorks', 'en'), '/careers/how-it-works');

assert.equal(mapCareersPathForLanguage('/werken-bij', 'en'), '/careers');
assert.equal(mapCareersPathForLanguage('/werken-bij/vacatures', 'en'), '/careers/jobs');
assert.equal(
  mapCareersPathForLanguage('/werken-bij/hoe-werkt-het', 'en'),
  '/careers/how-it-works',
);
assert.equal(mapCareersPathForLanguage('/careers', 'nl'), '/werken-bij');
assert.equal(mapCareersPathForLanguage('/careers/jobs', 'nl'), '/werken-bij/vacatures');
assert.equal(
  mapCareersPathForLanguage('/careers/how-it-works', 'nl'),
  '/werken-bij/hoe-werkt-het',
);
assert.equal(mapCareersPathForLanguage('/faq', 'en'), '/faq');
assert.equal(mapCareersPathForLanguage('/werken-bij', 'nl'), '/werken-bij');
assert.equal(mapCareersPathForLanguage('/careers', 'en'), '/careers');

const hreflangHub = careersHreflangLanguages('hub');
assert.match(hreflangHub['nl-NL'], /\/werken-bij$/);
assert.match(hreflangHub['en-US'], /\/careers$/);
assert.equal(hreflangHub['en-US'], hreflangHub['x-default']);

assert.match(nav, /careersPath\('hub', language\)/);
assert.match(nav, /data-hc-public-careers-nav/);
assert.doesNotMatch(nav, /\{user \? \(\s*<Link\s+href=\{PUBLIC_CAREERS_PATH\}/);
assert.match(nav, /PUBLIC_EARN_CHILD_LINKS\.map/);
assert.match(i18nHook, /mapCareersPathForLanguage/);

assert.equal(nl.navbar.werkenBij, 'Werken bij HomeCheff');
assert.equal(en.navbar.werkenBij, 'Careers');
assert.equal(nl.navbar.earnWithHomecheff, 'Verdien met HomeCheff');
assert.equal(en.navbar.earnWithHomecheff, 'Earn with HomeCheff');

assert.doesNotMatch(werkenPage, /redirect\(['"]\/login/);
assert.doesNotMatch(werkenLayout, /redirect\(['"]\/login/);
assert.doesNotMatch(careersPage, /redirect\(['"]\/login/);
assert.doesNotMatch(careersLayout, /redirect\(['"]\/login/);
assert.match(affiliateDash, /redirect\('\/login'\)/);
assert.match(sellerDash, /redirect\('\/login'\)/);
assert.match(deliveryDash, /callbackUrl=\/delivery\/dashboard/);

for (const rel of [
  'app/careers/page.tsx',
  'app/careers/jobs/page.tsx',
  'app/careers/how-it-works/page.tsx',
  'app/werken-bij/page.tsx',
  'app/werken-bij/vacatures/page.tsx',
  'app/werken-bij/hoe-werkt-het/page.tsx',
]) {
  assert.ok(existsSync(resolve(root, rel)), `missing ${rel}`);
}

assert.match(werkenLayout, /careersHreflangLanguages\('hub'\)/);
assert.match(careersLayout, /careersHreflangLanguages\('hub'\)/);
assert.match(read('app/werken-bij/vacatures/page.tsx'), /careersHreflangLanguages\('jobs'\)/);
assert.match(read('app/careers/jobs/page.tsx'), /careersHreflangLanguages\('jobs'\)/);
assert.match(
  read('app/werken-bij/hoe-werkt-het/page.tsx'),
  /careersHreflangLanguages\('howItWorks'\)/,
);
assert.match(
  read('app/careers/how-it-works/page.tsx'),
  /careersHreflangLanguages\('howItWorks'\)/,
);

console.log('validate-public-careers-nav: PASS');
