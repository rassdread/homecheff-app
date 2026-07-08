#!/usr/bin/env npx tsx
/**
 * Phase 11C — Growth engine & business model guard.
 *
 * Verifies pilot growth surfaces, instrumentation compatibility, revenue paths,
 * frozen architecture, and chains Phase 11B financial validator.
 *
 * Run: npx tsx scripts/validate-growth-engine-phase11c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const PRIOR_VALIDATORS = [
  'scripts/validate-follow-the-money-phase11b.ts',
  'scripts/validate-release-candidate-phase11a.ts',
  'scripts/validate-settlement-router-phase8e.ts',
];

const GROWTH_SSOT = [
  'lib/discovery/growth/growth-surface-contract.ts',
  'lib/discovery/growth/resolve-growth-surface-bundle.ts',
  'lib/discovery/growth/index.ts',
];

const REVENUE_PATHS = [
  'app/api/checkout/route.ts',
  'app/api/subscribe/route.ts',
  'lib/affiliate-commission.ts',
  'lib/fees.ts',
];

console.log('=== Phase 11C — Growth Engine ===\n');

// --- 11C.1 Deliverables -------------------------------------------------------
console.log('11C.1 Deliverables');
assert(exists('docs/audits/GROWTH_ENGINE_PHASE11C_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE11C_GROWTH_ENGINE.md'),
  'progress doc',
);
assert(exists('scripts/validate-growth-engine-phase11c.ts'), 'validator script');

// --- 11C.2 Architecture frozen ------------------------------------------------
console.log('\n11C.2 Architecture frozen (7A–11B)');
for (const f of [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-router.ts',
  'lib/feed/home-filter-persist.ts',
  ...GROWTH_SSOT,
]) {
  assert(exists(f), f);
}
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 11C'), 'no 11C arch stamp');
assert(
  !exists('lib/discovery/growth/growth-surface-contract-v2.ts'),
  'no parallel growth contract',
);

// --- 11C.3 Acquisition surfaces -----------------------------------------------
console.log('\n11C.3 Acquisition');
assert(exists('components/home/HomeHeroSection.tsx'), 'homepage hero');
assert(exists('lib/seo/homecheffSeoPages.data.ts'), 'SEO landing data');
assert(exists('app/seo-hub/page.tsx'), 'SEO hub');
assert(read('lib/seo/localCities.ts').includes("slug: 'vlaardingen'"), 'pilot city Vlaardingen in SEO');
const sitemap = read('lib/seo/sitemapXml.ts');
assert(!sitemap.includes('"/growth"'), 'sitemap: no broken /growth');
assert(sitemap.includes('"/affiliate"'), 'sitemap: affiliate');
assert(exists('app/welkom/[code]/page.tsx'), 'referral welkom route');
assert(exists('components/affiliate/AffiliateQuickShareModal.tsx'), 'affiliate QR share');

// --- 11C.4 Activation & onboarding --------------------------------------------
console.log('\n11C.4 Activation');
assert(exists('lib/onboarding/hints.ts'), 'onboarding hints');
assert(exists('lib/onboarding/onboarding-analytics.ts'), 'onboarding analytics');
assert(exists('app/api/onboarding/analytics/route.ts'), 'onboarding analytics API');
assert(exists('components/onboarding/OnboardingTour.tsx'), 'onboarding tour');
assert(exists('lib/onboarding/pending-intent.ts'), 'pending intent resume');

// --- 11C.5 Retention loops ----------------------------------------------------
console.log('\n11C.5 Retention');
assert(exists('lib/notifications/notification-service.ts'), 'notification service');
assert(exists('components/favorite/FavoriteButton.tsx'), 'favorites');
assert(exists('components/follow/FollowButton.tsx'), 'follow');
assert(exists('app/messages/page.tsx'), 'messages');
assert(exists('lib/gamification/hcp-actions.ts'), 'HCP actions');
assert(exists('components/gamification/HcpActivationCard.tsx'), 'HCP activation card');

// --- 11C.6 Marketplace liquidity ----------------------------------------------
console.log('\n11C.6 Marketplace liquidity');
const geo = read('components/feed/GeoFeed.tsx');
assert(geo.includes('emptySale') && geo.includes('emptyGezocht'), 'feed empty states');
assert(geo.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'), 'canonical category discovery');
assert(exists('components/feed/DiscoveryDirectionToggle.tsx'), 'reverse discovery toggle');
assert(exists('components/feed/AcceptedValuesDiscoveryFilter.tsx'), 'accepted values filter');

// --- 11C.7 Revenue model intact -----------------------------------------------
console.log('\n11C.7 Revenue paths intact');
for (const f of REVENUE_PATHS) {
  assert(exists(f), f);
}
assert(read('app/api/checkout/route.ts').includes('resolveCheckoutBlockReason'), 'checkout settlement gate');
assert(read('app/api/subscribe/route.ts').includes('authSession.user.id'), 'subscribe session auth');
assert(read('lib/fees.ts').includes('DEFAULT_PLATFORM_FEE_PERCENT'), 'platform fee model');

// --- 11C.8 Growth loops (existing components) ---------------------------------
console.log('\n11C.8 Growth loops');
assert(exists('components/ui/ShareButton.tsx'), 'social share');
assert(exists('lib/affiliate-attribution.ts'), 'affiliate attribution');
assert(exists('components/home/UserActionCenter.tsx'), 'user action center');
assert(read('lib/discovery/growth/index.ts').includes('buildGrowthMobileInserts'), 'growth mobile inserts');

// --- 11C.9 Analytics instrumentation ------------------------------------------
console.log('\n11C.9 Analytics instrumentation');
const consent = read('components/ConsentAwareAnalytics.tsx');
assert(consent.includes('GoogleAnalytics'), 'GA4 wired behind consent');
assert(consent.includes('VercelAnalytics'), 'Vercel analytics');
assert(exists('components/GoogleAnalytics.tsx'), 'GA helpers');
assert(exists('lib/marketplace/exchange/exchange-funnel-analytics.ts'), 'exchange funnel analytics');
assert(exists('app/api/analytics/track-view/route.ts'), 'view tracking API');

// --- 11C.10 Admin measurement -------------------------------------------------
console.log('\n11C.10 Admin measurement');
assert(exists('app/api/admin/analytics/route.ts'), 'admin analytics API');
assert(exists('app/api/admin/financial/route.ts'), 'admin financial API');
assert(exists('components/admin/AnalyticsDashboard.tsx'), 'admin analytics UI');

// --- 11C.11 No duplicate systems ----------------------------------------------
console.log('\n11C.11 No duplicate systems');
assert(
  !read('components/feed/GeoFeed.tsx').includes('growth-surface-contract-v2'),
  'no parallel feed growth contract',
);
assert(
  read('lib/discovery/growth/growth-surface-contract.ts').includes('FORBIDDEN_GROWTH_EFFECTS'),
  'growth contract guardrails',
);

// --- 11C.12 Chained validators ------------------------------------------------
console.log('\n11C.12 Chained validators');
for (const script of PRIOR_VALIDATORS) {
  assert(exists(script), script);
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
