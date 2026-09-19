#!/usr/bin/env npx tsx
/**
 * Static guard: public Careers/Werken-bij discovery is always in the header
 * (logged in and logged out) and uses the canonical /werken-bij route.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PUBLIC_CAREERS_PATH,
  PUBLIC_EARN_HUB_PATH,
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
const affiliateDash = read('app/affiliate/dashboard/page.tsx');
const sellerDash = read('app/verkoper/dashboard/page.tsx');
const deliveryDash = read('app/delivery/dashboard/page.tsx');

assert.equal(PUBLIC_CAREERS_PATH, '/werken-bij');
assert.equal(PUBLIC_EARN_HUB_PATH, '/werken-bij');

assert.match(nav, /PUBLIC_CAREERS_PATH/);
assert.match(nav, /data-hc-public-careers-nav/);
assert.doesNotMatch(
  nav,
  /WX 1C\.1\.2 — Careers only in primary desktop nav when signed in/,
);
assert.doesNotMatch(nav, /\{user \? \(\s*<Link\s+href=\{PUBLIC_CAREERS_PATH\}/);
assert.match(nav, /PUBLIC_EARN_CHILD_LINKS\.map/);

assert.equal(nl.navbar.werkenBij, 'Werken bij HomeCheff');
assert.equal(en.navbar.werkenBij, 'Careers');
assert.equal(nl.navbar.earnWithHomecheff, 'Verdien met HomeCheff');
assert.equal(en.navbar.earnWithHomecheff, 'Earn with HomeCheff');

assert.doesNotMatch(werkenPage, /redirect\(['"]\/login/);
assert.doesNotMatch(werkenLayout, /redirect\(['"]\/login/);
assert.match(affiliateDash, /redirect\('\/login'\)/);
assert.match(sellerDash, /redirect\('\/login'\)/);
assert.match(deliveryDash, /callbackUrl=\/delivery\/dashboard/);

console.log('validate-public-careers-nav: PASS');
