#!/usr/bin/env npx tsx
/**
 * Marketplace header — orientation strip with buyer/seller CTA hierarchy.
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
assert(!hero.includes('homePhase1.ctaDiscover'), 'discover CTA removed from legacy hero');

const orientation = readFileSync('components/adaptive-workspace/WorkspaceOrientationStrip.tsx', 'utf8');
assert(!orientation.includes('Compass'), 'discover compass CTA removed from AW orientation strip');
assert(orientation.includes('homePhase1.ctaDiscover'), 'buyer discover CTA on AW orientation strip');
assert(orientation.includes('homePhase1.ctaShare'), 'seller share CTA on AW orientation strip');
assert(orientation.includes('data-wx-buyer-cta'), 'buyer CTA marked primary path');
assert(orientation.includes('data-wx-seller-cta'), 'seller CTA marked secondary path');
assert(orientation.includes('orientationLocalLaunchNote') || orientation.includes('homePhase1.orientationLocalLaunchNote'), 'local launch trust note');
assert(!hero.includes('landscape:sr-only'), 'no icon-only share in landscape');
assert(hero.includes('homeCompactHeader.supportLine'), 'single support line key');

console.log('  ✅ one merged header');
console.log('  ✅ buyer primary + seller secondary CTAs');
console.log('  ✅ no duplicate HomepageEcosystemSignal band');

console.log('\n=== Result: compact header checks passed ===\n');
