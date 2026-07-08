#!/usr/bin/env npx tsx
/**
 * Phase 12B — Business DNA & subscription experience guard.
 *
 * Verifies single SSOT, growth UI, commission consistency (12/9/7/5),
 * and chains Phase 12A validator.
 *
 * Run: npx tsx scripts/validate-business-dna-phase12b.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  getBusinessVisibilityProfile,
  getBusinessDnaProfile,
  listBusinessPlanIds,
  resolvePlatformFeePercent,
  BUSINESS_VISIBILITY_RANK_CAP,
} from '../lib/business/visibility-profile';
import { buildSubscriptionComparisonRows } from '../lib/business/subscription-comparison';

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

function grepCode(pattern: RegExp): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'docs' || entry.name === '.next') continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        const rel = path.relative(process.cwd(), full);
        if (rel.startsWith('scripts/validate-')) continue;
        const content = fs.readFileSync(full, 'utf8');
        if (pattern.test(content)) hits.push(rel);
      }
    }
  };
  walk(process.cwd());
  return hits;
}

const PRIOR_VALIDATORS = ['scripts/validate-business-growth-automation-phase12a.ts'];

console.log('=== Phase 12B — Business DNA ===\n');

// --- 12B.1 Deliverables -------------------------------------------------------
console.log('12B.1 Deliverables');
assert(exists('docs/audits/BUSINESS_DNA_PHASE12B_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE12B_BUSINESS_DNA.md'),
  'progress doc',
);
assert(exists('scripts/validate-business-dna-phase12b.ts'), 'validator script');

// --- 12B.2 One Business DNA SSOT ----------------------------------------------
console.log('\n12B.2 Business DNA SSOT');
assert(exists('lib/business/visibility-profile.ts'), 'visibility-profile.ts');
assert(exists('lib/business/subscription-comparison.ts'), 'subscription-comparison.ts');
assert(
  read('lib/business/visibility-profile.ts').includes('getBusinessDnaProfile'),
  'getBusinessDnaProfile alias',
);
assert(
  read('lib/business/visibility-profile.ts').includes('commissionPercent'),
  'commissionPercent field',
);
assert(
  read('lib/business/visibility-profile.ts').includes('futureAiMarketing'),
  'futureAiMarketing flag',
);
assert(
  read('lib/business/visibility-profile.ts').includes('futureBusinessApi'),
  'futureBusinessApi flag',
);
assert(
  read('lib/business/visibility-profile.ts').includes('futureFranchiseSupport'),
  'futureFranchiseSupport flag',
);

const plans = listBusinessPlanIds();
assert(plans.length === 4, 'four plans defined');

assert(getBusinessVisibilityProfile('individual').commissionPercent === 12, 'Individual 12%');
assert(getBusinessVisibilityProfile('basic').commissionPercent === 9, 'Basic 9%');
assert(getBusinessVisibilityProfile('pro').commissionPercent === 7, 'Pro 7%');
assert(getBusinessVisibilityProfile('premium').commissionPercent === 5, 'Premium 5%');

const premium = getBusinessDnaProfile('premium');
assert(premium.premiumBadge === true, 'premium badge flag');
assert(premium.homepageSpotlightEligible === true, 'homepage spotlight eligible');
assert(premium.futureAiMarketing === true, 'AI marketing future flag');
assert(premium.multipleLocations >= 2, 'premium multi-location');

// --- 12B.3 Shared commission source -------------------------------------------
console.log('\n12B.3 Commission source consistency');
const ssotPaths = [
  'lib/stripe.ts',
  'app/api/stripe/webhook/route.ts',
  'app/api/seller/dashboard/stats/route.ts',
  'app/api/seller/earnings/route.ts',
  'app/api/earnings/combined/route.ts',
  'app/api/earnings/export/route.ts',
  'app/api/seller/payouts/request/route.ts',
];
for (const f of ssotPaths) {
  assert(read(f).includes('getBusinessVisibilityProfile'), `${f} uses SSOT`);
}

assert(
  read('lib/stripe.ts').includes('getBusinessVisibilityProfile'),
  'stripe BUSINESS_PLATFORM_FEES from SSOT',
);

// Affiliate uses transaction homecheff fee — no hardcoded plan %
const affiliate = read('lib/affiliate-commission.ts');
assert(!affiliate.includes('feeBps: 200'), 'affiliate: no legacy premium fee');
assert(affiliate.includes('homecheffFeeCents'), 'affiliate: uses platform fee from transactions');

// --- 12B.4 Ranking + badges + analytics ---------------------------------------
console.log('\n12B.4 Ranking, badges, analytics from SSOT');
assert(
  read('lib/discovery/ranking/business-visibility-boost.ts').includes('getBusinessVisibilityProfile'),
  'ranking boost from visibility profile',
);
assert(
  read('lib/marketplace/tiles/build-tile-badges.ts').includes('businessPlanLabelKey'),
  'tile badges from SSOT label keys',
);
assert(
  read('lib/business/analytics-tier.ts').includes('AnalyticsLevel'),
  'analytics tier module',
);
assert(
  read('app/verkoper/analytics/page-client.tsx').includes('canAccessAnalyticsMetric'),
  'analytics UI gated',
);

const dnaBoost = getBusinessVisibilityProfile('premium').rankingBoost;
assert(dnaBoost <= BUSINESS_VISIBILITY_RANK_CAP, 'ranking boost within cap');

// --- 12B.5 Subscription UI matches backend ------------------------------------
console.log('\n12B.5 Growth-focused subscription UI');
assert(exists('components/business/SubscriptionComparisonTable.tsx'), 'comparison table');
assert(exists('components/business/SubscriptionPlanCards.tsx'), 'plan cards');
const sell = read('app/sell/page.tsx');
assert(sell.includes('SubscriptionComparisonTable'), 'sell: comparison table');
assert(sell.includes('SubscriptionPlanCards'), 'sell: plan cards');
assert(sell.includes('getBusinessVisibilityProfile'), 'sell: reads DNA SSOT');
assert(sell.includes('business.dna.growthTitle'), 'sell: growth headline i18n');
assert(!sell.includes('lagere platformfee'), 'sell: no fee-first Dutch copy');

const rows = buildSubscriptionComparisonRows();
assert(rows.length >= 10, 'comparison has feature rows');
assert(rows[0].featureKey.includes('commission'), 'commission is a row not headline');

// --- 12B.6 No scattered hardcoded plan checks ---------------------------------
console.log('\n12B.6 No duplicate plan logic');
const hardcoded = grepCode(
  /if\s*\(\s*plan\s*===\s*['"]premium['"]|if\s*\(\s*plan\s*===\s*['"]pro['"]|feeBps\s*===\s*700|feeBps\s*===\s*400|feeBps\s*===\s*200/,
);
const allowed = hardcoded.filter(
  (f) =>
    !f.includes('visibility-profile.ts') &&
    !f.includes('validate-business'),
);
assert(allowed.length === 0, `no scattered plan checks (found: ${allowed.join(', ') || 'none'})`);

assert(
  read('components/ui/BusinessBadge.tsx').includes('getBusinessVisibilityProfile'),
  'BusinessBadge uses SSOT',
);

// --- 12B.7 i18n growth copy ---------------------------------------------------
console.log('\n12B.7 i18n Business DNA keys');
try {
  const nl = JSON.parse(read('public/i18n/nl.json'));
  const en = JSON.parse(read('public/i18n/en.json'));
  assert(Boolean(nl.business?.dna?.growthTitle), 'nl growth title');
  assert(Boolean(en.business?.dna?.compare?.title), 'en compare title');
  assert(Boolean(nl.business?.dna?.pillar?.visibility), 'nl visibility pillar');
} catch {
  assert(false, 'i18n JSON parse');
}

// --- 12B.8 Architecture frozen ------------------------------------------------
console.log('\n12B.8 Architecture frozen');
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 12B'), 'no 12B arch stamp');
assert(
  !exists('lib/business/visibility-profile-v2.ts'),
  'no parallel DNA module',
);

// --- 12B.9 Chained validators -------------------------------------------------
console.log('\n12B.9 Chained validators');
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
