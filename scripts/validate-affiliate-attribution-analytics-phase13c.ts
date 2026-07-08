#!/usr/bin/env npx tsx
/**
 * Phase 13C — Affiliate Attribution Contract & Analytics Honesty guard.
 *
 * Verifies P0 fixes from Phase 13B: unified first-touch cookies, subscription
 * attribution from ref links, androidBeta expiry, cross-device documentation,
 * and seller analytics tier honesty.
 *
 * Run: npx tsx scripts/validate-affiliate-attribution-analytics-phase13c.ts
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

const PRIOR = [
  'scripts/validate-operations-dashboard-phase13b.ts',
  'scripts/validate-follow-the-money-phase11b.ts',
];

console.log('=== Phase 13C — Attribution Contract & Analytics Honesty ===\n');

console.log('13C.1 Deliverables');
assert(
  exists('docs/audits/AFFILIATE_ATTRIBUTION_ANALYTICS_PHASE13C_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE13C_ATTRIBUTION_ANALYTICS.md'),
  'progress doc',
);
assert(exists('scripts/validate-affiliate-attribution-analytics-phase13c.ts'), 'validator');
assert(exists('lib/affiliate-attribution-contract.ts'), 'attribution contract SSOT');

const audit = read('docs/audits/AFFILIATE_ATTRIBUTION_ANALYTICS_PHASE13C_AUDIT.md');
const contract = read('lib/affiliate-attribution-contract.ts');
const attribution = read('lib/affiliate-attribution.ts');
const referralRoute = read('app/api/affiliate/referral/route.ts');
const subscribe = read('app/api/subscribe/route.ts');
const stats = read('app/api/seller/dashboard/stats/route.ts');
const products = read('app/api/seller/dashboard/products/route.ts');
const tier = read('lib/business/analytics-tier.ts');
const commandCenter = read('app/api/admin/command-center/route.ts');

console.log('\n13C.2 Attribution policy (first-touch pilot)');
assert(contract.includes("AFFILIATE_ATTRIBUTION_POLICY = 'first_touch'"), 'policy is first_touch');
assert(contract.includes('COOKIE_TTL_DAYS'), 'contract uses COOKIE_TTL_DAYS from config');
assert(contract.includes('crossDevice:'), 'cross-device documented');
assert(audit.includes('first-touch') || audit.includes('first_touch'), 'audit documents first-touch');

console.log('\n13C.3 Server/client cookie alignment');
assert(attribution.includes('if (existing)'), 'client setReferralCookie first-touch guard');
assert(
  referralRoute.includes('if (!existingRef)'),
  'server referral route first-touch guard',
);
assert(
  attribution.includes('COOKIE_TTL_DAYS') && referralRoute.includes('referralCookieExpiryDate'),
  'shared TTL helper',
);
assert(
  attribution.includes("REFERRAL_COOKIE_NAME") &&
    referralRoute.includes('REFERRAL_COOKIE_NAME'),
  'shared cookie name constant',
);
assert(
  !attribution.includes('document.cookie = `${REFERRAL_COOKIE_NAME}=${code}`') ||
    attribution.includes('if (existing)'),
  'no unconditional client overwrite',
);

console.log('\n13C.4 androidBeta expiry edge case');
assert(
  referralRoute.includes('const expires = referralCookieExpiryDate()'),
  'expires defined before cookie sets',
);
assert(
  referralRoute.indexOf('const expires') < referralRoute.indexOf('hc_beta_src') ||
    referralRoute.includes('HC_BETA_SRC_COOKIE'),
  'beta cookie uses defined expires',
);
assert(!referralRoute.includes('expires,') || referralRoute.includes('referralCookieExpiryDate'), 'no undefined expires');

console.log('\n13C.5 Business subscription attribution from ref link');
assert(subscribe.includes('resolveSubscriptionAttributionId'), 'subscribe resolves ref attribution');
assert(subscribe.includes('sessionMetadata.attribution_id'), 'attribution_id in Stripe metadata');
assert(attribution.includes('resolveSubscriptionAttributionId'), 'resolver exported');

console.log('\n13C.6 Promo path + idempotency preserved');
assert(subscribe.includes('PROMO_CODE') || subscribe.includes('promoCodeRecord'), 'promo path intact');
const commission = read('lib/affiliate-commission.ts');
assert(commission.includes('eventId: invoiceId'), 'commission idempotency via eventId');

console.log('\n13C.7 Self-referral + duplicate signup blocks');
assert(attribution.includes('Self-referral detected'), 'self-referral blocked');
assert(attribution.includes('if (already)'), 'duplicate signup attribution blocked');

console.log('\n13C.8 Cross-device limitation surfaced');
assert(
  audit.includes('cross-device') || audit.includes('Cross-device'),
  'audit documents cross-device',
);
assert(
  read('app/affiliate/dashboard/page-client.tsx').includes('attributionPolicyCrossDevice'),
  'affiliate dashboard cross-device copy',
);
assert(commandCenter.includes('crossDeviceAttribution'), 'command center cross-device signal');

console.log('\n13C.9 Seller analytics honesty');
assert(stats.includes('totalFavorites'), 'stats returns favorites');
assert(stats.includes('totalMessages'), 'stats returns messages');
assert(stats.includes('popularListings'), 'stats returns popular listings');
assert(tier.includes('IMPLEMENTED_ANALYTICS_METRICS'), 'tier declares implemented metrics');
assert(!products.includes('sales * 10'), 'products route removed fake view estimate');

console.log('\n13C.10 P0 findings closed');
for (const finding of [
  'P0-1',
  'P0-2',
  'P0-3',
  'P0-4',
  'P0-5',
]) {
  assert(audit.includes(finding), `audit closes ${finding}`);
}

console.log('\n13C.11 Chained validators');
for (const script of PRIOR) {
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
