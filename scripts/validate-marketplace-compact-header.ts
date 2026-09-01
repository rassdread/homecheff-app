#!/usr/bin/env npx tsx
/**
 * Single compact marketplace header — no stacked intro bands, labeled CTAs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/page.tsx', 'utf8');
const hero = readFileSync('components/home/HomeHeroSection.tsx', 'utf8');

console.log('=== Marketplace compact header validator ===\n');

assert(!page.includes('HomepageEcosystemSignal'), 'no separate ecosystem band on homepage');
assert(hero.includes('data-hc-ecosystem-participation-signal'), 'SEO signal on merged header');
assert(hero.includes('HomepageEcosystemNavLinks'), 'ecosystem nav embedded in hero');
assert(!hero.includes('HeroVisualCluster'), 'no large desktop visual cluster');
assert(!hero.includes('HeroPlatformStrip'), 'no extra platform strip');
assert(hero.includes('homePhase1.ctaDiscover'), 'discover CTA labeled');
assert(hero.includes('homePhase1.ctaShare'), 'share CTA labeled');
assert(!hero.includes('landscape:sr-only'), 'no icon-only share in landscape');
assert(hero.includes('homeCompactHeader.supportLine'), 'single support line key');

console.log('  ✅ one merged header');
console.log('  ✅ labeled CTAs');
console.log('  ✅ no duplicate HomepageEcosystemSignal band');

console.log('\n=== Result: compact header checks passed ===\n');
