#!/usr/bin/env npx tsx
/**
 * Phase 13A — Admin Command Center guard.
 *
 * Run: npx tsx scripts/validate-admin-command-center-phase13a.ts
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

function hasAdminGuard(source: string): boolean {
  return (
    source.includes("user.role !== 'ADMIN' && user.role !== 'SUPERADMIN'") ||
    source.includes("user.role !== 'SUPERADMIN' && user.role !== 'ADMIN'")
  );
}

const PRIOR = [
  'scripts/validate-business-growth-preview-phase12c.ts',
  'scripts/validate-follow-the-money-phase11b.ts',
];

console.log('=== Phase 13A — Admin Command Center ===\n');

console.log('13A.1 Deliverables');
assert(exists('docs/audits/ADMIN_COMMAND_CENTER_PHASE13A_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE13A_ADMIN_COMMAND_CENTER.md'), 'progress doc');
assert(exists('scripts/validate-admin-command-center-phase13a.ts'), 'validator');

console.log('\n13A.2 Command center endpoint + UI');
assert(exists('app/api/admin/command-center/route.ts'), 'command center api route');
assert(exists('components/admin/AdminCommandCenter.tsx'), 'command center component');
assert(read('components/admin/AdminDashboard.tsx').includes('command-center'), 'dashboard includes command-center tab');

console.log('\n13A.3 Admin protection and leakage');
const ccRoute = read('app/api/admin/command-center/route.ts');
assert(hasAdminGuard(ccRoute), 'command center route protected by admin role');
const stripeStatus = read('app/api/admin/stripe-status/route.ts');
assert(hasAdminGuard(stripeStatus), 'stripe status protected by admin role');
assert(!stripeStatus.includes('substring(0, 15)'), 'stripe secret prefix not exposed');
assert(!stripeStatus.includes('substring(0, 10)'), 'webhook/connect prefixes not exposed');

console.log('\n13A.4 Canonical model / SSOT / helper reuse');
assert(ccRoute.includes('listingIntent'), 'uses canonical listing intent');
assert(ccRoute.includes('marketplaceCategory'), 'uses canonical marketplace category');
assert(ccRoute.includes('barterOpenness'), 'uses canonical settlement-value fields');
assert(ccRoute.includes('getBusinessVisibilityProfile'), 'uses Business DNA SSOT');

console.log('\n13A.5 No fake metrics discipline');
assert(ccRoute.includes('notTracked('), 'supports explicit not-tracked metrics');
assert(ccRoute.includes('tracked: false'), 'returns not-tracked status flags');
assert(read('components/admin/AdminCommandCenter.tsx').includes('not tracked yet'), 'UI shows not-tracked label');

console.log('\n13A.6 Scope coverage checks');
assert(ccRoute.includes('pendingStripeConnectSellers'), 'stripe/connect health visible');
assert(ccRoute.includes('productionBackfillStatus'), 'production backfill status visible');
assert(ccRoute.includes('subscriptionsMrrEstimateCents'), 'subscription metrics visible');
assert(ccRoute.includes('totalListings'), 'marketplace metrics visible');
assert(ccRoute.includes('cronStatus'), 'affiliate cron warning signal present');

console.log('\n13A.7 No meal-only legacy labels in new command center');
const commandCenterUi = read('components/admin/AdminCommandCenter.tsx').toLowerCase();
assert(!commandCenterUi.includes('maaltijd'), 'no meal-only dutch wording');

console.log('\n13A.8 Chained validators');
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
