#!/usr/bin/env npx tsx
/**
 * Phase 13B — Operations Dashboard Intelligence guard.
 *
 * Verifies audit deliverables, SSOT references, tracked:false discipline,
 * attribution contract documentation, and chains Phase 13A + 12C + 11C.
 *
 * Run: npx tsx scripts/validate-operations-dashboard-phase13b.ts
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
  'scripts/validate-admin-command-center-phase13a.ts',
  'scripts/validate-business-growth-preview-phase12c.ts',
  'scripts/validate-growth-engine-phase11c.ts',
];

console.log('=== Phase 13B — Operations Dashboard Intelligence ===\n');

console.log('13B.1 Deliverables');
assert(exists('docs/audits/OPERATIONS_DASHBOARD_INTELLIGENCE_PHASE13B_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE13B_OPERATIONS_DASHBOARDS.md'),
  'progress doc',
);
assert(exists('scripts/validate-operations-dashboard-phase13b.ts'), 'validator');

const audit = read('docs/audits/OPERATIONS_DASHBOARD_INTELLIGENCE_PHASE13B_AUDIT.md');

console.log('\n13B.2 Audit structure (7 parts)');
for (const part of [
  'PART 1 — Seller Dashboard Intelligence',
  'PART 2 — Affiliate Growth Center',
  'PART 3 — Affiliate Attribution Contract Audit',
  'PART 4 — Delivery Operations Dashboard',
  'PART 5 — Analytics Dashboards',
  'PART 6 — Cross Dashboard Consistency',
  'PART 7 — Operational Readiness',
]) {
  assert(audit.includes(part), part);
}

console.log('\n13B.3 Executive verdicts');
for (const verdict of [
  'Seller Dashboard',
  'Affiliate Dashboard',
  'Delivery Dashboard',
  'Analytics',
  'Overall Operations Readiness',
]) {
  assert(audit.includes(verdict), `verdict: ${verdict}`);
}

console.log('\n13B.4 No fake metrics / tracked discipline');
assert(audit.includes('tracked: false'), 'audit documents tracked:false');
assert(audit.includes('No fake metrics'), 'audit states no fake metrics rule');
assert(!audit.includes('invent metrics'), 'no invent metrics language');

console.log('\n13B.5 SSOT references (reuse, no duplicate APIs)');
for (const ssot of [
  'visibility-profile.ts',
  'settlement-router.ts',
  'canonical-model.ts',
  'affiliate-config.ts',
  'affiliate-attribution.ts',
  'fetch-seller-trust-snapshots.ts',
]) {
  assert(audit.includes(ssot), `SSOT cited: ${ssot}`);
}

console.log('\n13B.6 Priority classification');
for (const level of ['P0', 'P1', 'P2', 'P3']) {
  assert(audit.includes(level), `findings include ${level}`);
}

console.log('\n13B.7 Attribution contract scenarios');
for (const scenario of [
  'Self-referral',
  'Desktop click → mobile register',
  'Google login',
  'Cookie expires',
  'Affiliate A → Affiliate B',
]) {
  assert(audit.includes(scenario) || audit.toLowerCase().includes(scenario.toLowerCase()), scenario);
}

console.log('\n13B.8 Seller dashboard surfaces exist');
for (const f of [
  'app/verkoper/dashboard/page-client.tsx',
  'app/verkoper/analytics/page-client.tsx',
  'app/verkoper/revenue/page-client.tsx',
  'app/api/seller/dashboard/stats/route.ts',
  'lib/business/analytics-tier.ts',
]) {
  assert(exists(f), f);
}

console.log('\n13B.9 Affiliate surfaces exist');
for (const f of [
  'app/affiliate/dashboard/page-client.tsx',
  'lib/affiliate-attribution.ts',
  'app/api/affiliate/referral/route.ts',
  'lib/affiliate-config.ts',
]) {
  assert(exists(f), f);
}

console.log('\n13B.10 Delivery surfaces exist');
for (const f of [
  'components/delivery/DeliveryDashboard.tsx',
  'app/api/delivery/dashboard/route.ts',
  'lib/fees.ts',
]) {
  assert(exists(f), f);
}

console.log('\n13B.11 Analytics tier honesty gap documented');
const tier = read('lib/business/analytics-tier.ts');
const stats = read('app/api/seller/dashboard/stats/route.ts');
assert(tier.includes('IMPLEMENTED_ANALYTICS_METRICS'), 'analytics tier declares implemented metrics');
assert(stats.includes('totalViews'), 'stats returns views');
assert(
  audit.includes('favorites') && audit.includes('messages'),
  'audit flags favorites/messages gap',
);

console.log('\n13B.12 Pilot autonomy answer');
assert(audit.includes('autonomous') || audit.includes('Pilot-capable'), 'pilot autonomy addressed');

console.log('\n13B.13 Chained validators');
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
