#!/usr/bin/env npx tsx
/**
 * Phase 12A — Business Growth Automation guard.
 *
 * Verifies visibility SSOT, updated commission model (9/7/5%),
 * capped ranking boost, self-service subscription paths, and chains 11B.
 *
 * Run: npx tsx scripts/validate-business-growth-automation-phase12a.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  BUSINESS_VISIBILITY_RANK_CAP,
  getBusinessVisibilityProfile,
} from '../lib/business/visibility-profile';

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

function grepCode(pattern: RegExp, excludeDocs = true): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (excludeDocs && (entry.name === 'docs' || entry.name === '.next')) continue;
        walk(full);
      } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
        const rel = path.relative(process.cwd(), full);
        if (excludeDocs && rel.startsWith('docs' + path.sep)) continue;
        const content = fs.readFileSync(full, 'utf8');
        if (pattern.test(content)) hits.push(rel);
      }
    }
  };
  walk(process.cwd());
  return hits;
}

const PRIOR_VALIDATORS = [
  'scripts/validate-follow-the-money-phase11b.ts',
  'scripts/validate-release-candidate-phase11a.ts',
];

console.log('=== Phase 12A — Business Growth Automation ===\n');

// --- 12A.1 Deliverables -------------------------------------------------------
console.log('12A.1 Deliverables');
assert(exists('docs/audits/BUSINESS_GROWTH_AUTOMATION_PHASE12A_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE12A_BUSINESS_GROWTH_AUTOMATION.md'),
  'progress doc',
);
assert(exists('scripts/validate-business-growth-automation-phase12a.ts'), 'validator script');

// --- 12A.2 Visibility SSOT ----------------------------------------------------
console.log('\n12A.2 Visibility profile SSOT');
assert(exists('lib/business/visibility-profile.ts'), 'visibility-profile.ts');
assert(exists('lib/business/analytics-tier.ts'), 'analytics-tier.ts');
assert(exists('lib/discovery/ranking/business-visibility-boost.ts'), 'business-visibility-boost.ts');
assert(exists('components/business/BusinessPlanBadge.tsx'), 'BusinessPlanBadge component');

const basic = getBusinessVisibilityProfile('basic');
const pro = getBusinessVisibilityProfile('pro');
const premium = getBusinessVisibilityProfile('premium');
const individual = getBusinessVisibilityProfile('individual');

assert(basic.feeBps === 900 && basic.feePercent === 9, 'Basic fee = 9%');
assert(pro.feeBps === 700 && pro.feePercent === 7, 'Pro fee = 7%');
assert(premium.feeBps === 500 && premium.feePercent === 5, 'Premium fee = 5%');
assert(individual.feePercent === 12, 'Individual fee = 12%');
assert(basic.businessBadge === 'business', 'Basic business badge');
assert(pro.businessBadge === 'pro', 'Pro badge');
assert(premium.premiumBadge === true, 'Premium premium badge flag');
assert(premium.websiteVisible === true, 'Premium future: website eligibility');
assert(premium.socialsVisible === true, 'Premium future: socials eligibility');

const visProfile = read('lib/business/visibility-profile.ts');
assert(visProfile.includes('PLAN_CONFIG'), 'plan benefits centralized in PLAN_CONFIG');
assert(visProfile.includes('Do not scatter plan checks'), 'SSOT documentation');

// --- 12A.3 No legacy 2% Premium in product code -----------------------------
console.log('\n12A.3 Financial integrity — no legacy Premium 2%');
const legacyPremiumHits = grepCode(/feeBps:\s*200|feePercentage:\s*2[^0-9]|PREMIUM.*2%|2% platform fee.*Premium/i);
const filteredLegacy = legacyPremiumHits.filter(
  (f) =>
    !f.includes('validate-business-growth') &&
    !f.includes('validate-business-dna') &&
    !f.includes('DELIVERY_PLATFORM'),
);
assert(filteredLegacy.length === 0, `no legacy 2% Premium refs (found: ${filteredLegacy.join(', ') || 'none'})`);

const pricing = read('lib/pricing.ts');
assert(pricing.includes('feePercentage: 9'), 'pricing.ts Basic 9%');
assert(pricing.includes('feePercentage: 7'), 'pricing.ts Pro 7%');
assert(pricing.includes('feePercentage: 5'), 'pricing.ts Premium 5%');

const stripeLib = read('lib/stripe.ts');
assert(stripeLib.includes('getBusinessVisibilityProfile'), 'stripe fees from visibility SSOT');

const seedSubs = read('prisma/seed-subscriptions.js');
assert(seedSubs.includes('feeBps: 900'), 'seed Basic 900 bps');
assert(seedSubs.includes('feeBps: 700'), 'seed Pro 700 bps');
assert(seedSubs.includes('feeBps: 500'), 'seed Premium 500 bps');

const adminFinancial = read('app/api/admin/financial/route.ts');
assert(adminFinancial.includes('BASIC: 9'), 'admin financial BASIC 9%');
assert(adminFinancial.includes('PREMIUM: 5'), 'admin financial PREMIUM 5%');

// --- 12A.4 Ranking boost capped -----------------------------------------------
console.log('\n12A.4 Capped visibility ranking');
const boost = read('lib/discovery/ranking/business-visibility-boost.ts');
assert(boost.includes('BUSINESS_VISIBILITY_RANK_CAP'), 'boost uses rank cap constant');
assert(boost.includes('Math.min'), 'boost is capped');
assert(BUSINESS_VISIBILITY_RANK_CAP === 0.08, 'rank cap = 0.08');

const rankingProfiles = read('lib/discovery/ranking/ranking-profiles.ts');
assert(
  rankingProfiles.includes('boundedBusinessVisibilityRankBoost'),
  'baseline profile uses bounded boost',
);
assert(
  rankingProfiles.includes("'business_visibility_boost'"),
  'business boost in allowed signals',
);
assert(
  !rankingProfiles.includes('boundedBusinessVisibilityRankBoost(input)') ||
    !read('lib/discovery/ranking/ranking-profiles.ts')
      .split('trustedMakerProfile')[1]
      ?.includes('boundedBusinessVisibilityRankBoost'),
  'boost only in baseline (not trusted_maker)',
);

// Filters / eligibility unchanged
assert(rankingProfiles.includes('spam_listing_tier0'), 'trust spam gate remains');
assert(rankingProfiles.includes('inactive_listing'), 'inactive gate remains');

// --- 12A.5 Subscription self-service ------------------------------------------
console.log('\n12A.5 Self-service subscription');
for (const f of [
  'app/sell/page.tsx',
  'app/api/subscribe/route.ts',
  'app/api/subscribe/confirm/route.ts',
  'app/api/subscribe/cancel/route.ts',
  'app/api/stripe/webhook/route.ts',
]) {
  assert(exists(f), f);
}

const subscribe = read('app/api/subscribe/route.ts');
assert(subscribe.includes('authSession.user.id'), 'subscribe: session ownership');
assert(subscribe.includes('stripe.subscriptions.update'), 'subscribe: upgrade path');

const subscribeConfirm = read('app/api/subscribe/confirm/route.ts');
assert(subscribeConfirm.includes('authSession.user.id'), 'confirm: session ownership');

const subscribeCancel = read('app/api/subscribe/cancel/route.ts');
assert(subscribeCancel.includes('cancel_at_period_end'), 'cancel: period end');

const webhook = read('app/api/stripe/webhook/route.ts');
assert(webhook.includes('customer.subscription.updated'), 'webhook: subscription update');
assert(webhook.includes('past_due') || webhook.includes('revokeStatuses'), 'webhook: past_due grace');
assert(webhook.includes('getBusinessVisibilityProfile'), 'webhook: visibility SSOT for fees');
assert(
  !webhook.includes('prisma.subscription.upsert'),
  'webhook: no dangerous subscription upsert',
);

// --- 12A.6 Trust + badges wired -----------------------------------------------
console.log('\n12A.6 Trust snapshot + badges');
assert(
  read('lib/discovery/trust/fetch-seller-trust-snapshots.ts').includes('resolveBusinessPlanId'),
  'trust snapshots resolve business plan',
);
assert(
  read('lib/marketplace/tiles/build-tile-badges.ts').includes('businessPlanLabelKey'),
  'tile badges use plan label',
);
assert(
  read('components/profile/v2/ProfileV2Header.tsx').includes('BusinessPlanBadge'),
  'profile header plan badge',
);
assert(
  read('components/product/detail/ProductDetailTrustBlock.tsx').includes('BusinessPlanBadge'),
  'detail trust block plan badge',
);

// --- 12A.7 Analytics tiers ----------------------------------------------------
console.log('\n12A.7 Analytics tiers');
const analyticsTier = read('lib/business/analytics-tier.ts');
assert(analyticsTier.includes('IMPLEMENTED_ANALYTICS_METRICS'), 'implemented metrics documented');
assert(
  read('app/api/seller/dashboard/stats/route.ts').includes('analyticsLevel'),
  'dashboard stats expose analytics level',
);
assert(
  read('app/verkoper/analytics/page-client.tsx').includes('canAccessAnalyticsMetric'),
  'analytics UI gated by tier',
);

// --- 12A.8 Architecture frozen ------------------------------------------------
console.log('\n12A.8 Architecture frozen');
assert(exists('lib/marketplace/canonical-model.ts'), 'canonical-model.ts');
assert(exists('lib/marketplace/settlement/settlement-router.ts'), 'settlement-router.ts');
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 12A'), 'no 12A arch stamp');
assert(
  !exists('lib/business/visibility-profile-v2.ts'),
  'no duplicate visibility module',
);

// --- 12A.9 i18n fee copy ------------------------------------------------------
console.log('\n12A.9 i18n fee summary');
const nl = read('public/i18n/nl.json');
const en = read('public/i18n/en.json');
assert(nl.includes('9% platformfee') && nl.includes('5%'), 'nl fee summary 9/7/5');
assert(en.includes('9% platform fee') && en.includes('5%'), 'en fee summary 9/7/5');
try {
  const nlJson = JSON.parse(nl);
  const enJson = JSON.parse(en);
  assert(
    nlJson.business?.plan?.badge?.business === 'Business',
    'nl business badge keys',
  );
  assert(
    enJson.business?.plan?.badge?.premium === 'Premium',
    'en premium badge key',
  );
} catch {
  assert(false, 'i18n JSON parse');
}

// --- 12A.10 Chained validators ------------------------------------------------
console.log('\n12A.10 Chained validators');
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
