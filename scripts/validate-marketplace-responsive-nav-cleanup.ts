#!/usr/bin/env npx tsx
/**
 * Static guards for marketplace responsive nav cleanup (xl split + drawer labels).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nav = readFileSync('components/NavBar.tsx', 'utf8');
const bottomVis = readFileSync('lib/layout/bottomNavVisibility.ts', 'utf8');
const bottomInset = readFileSync('lib/layout/bottomNavInset.ts', 'utf8');
const myLinks = readFileSync('components/my-homecheff/MyHomeCheffNavLinks.tsx', 'utf8');
const ecoLinks = readFileSync('components/ecosystem/EcosystemAccountNavLinks.tsx', 'utf8');
const hero = readFileSync('components/home/HomeHeroSection.tsx', 'utf8');

console.log('=== Marketplace responsive nav cleanup validator ===\n');

assert(nav.includes('hidden xl:flex'), 'desktop nav xl+');
assert(nav.includes('xl:hidden'), 'compact hamburger below xl');
assert(!nav.includes('priorityOnly'), 'mobile drawer no longer uses unlabeled priorityOnly block');
assert(nav.includes('EcosystemAccountNavLinks'), 'ecosystem block in drawer');
assert(nav.includes('resolveNavLabel') || myLinks.includes('resolveNavLabel'), 'nav label fallbacks');
assert(nav.includes('bottomNavReachable'), 'drawer dedupes bottom-nav destinations');
assert(nav.includes('pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))]'), 'drawer safe-area above bottom nav');

assert(bottomVis.includes('max-xl:block xl:hidden'), 'bottom nav until xl');
assert(bottomInset.includes('max-xl:'), 'bottom inset aligned to xl');

assert(ecoLinks.includes('min-w-0 flex-1 truncate'), 'ecosystem rows always show label text');
assert(hero.includes('data-hc-ecosystem-participation-signal'), 'merged SEO signal in hero');

console.log('  ✅ xl breakpoint split (header + bottom nav)');
console.log('  ✅ drawer label + IA guards');
console.log('  ✅ feed-priority hero compact path');

console.log('\n=== Result: marketplace responsive nav cleanup checks passed ===\n');
