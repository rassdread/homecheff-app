#!/usr/bin/env npx tsx
/**
 * Phase 13D — Admin Operations & Control Center guard.
 *
 * Verifies audit deliverables, all 16 parts, permission matrix,
 * founder readiness verdict, P0–P3 classification, and chains Phase 13C.
 *
 * Run: npx tsx scripts/validate-admin-operations-phase13d.ts
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

const PRIOR = ['scripts/validate-affiliate-attribution-analytics-phase13c.ts'];

console.log('=== Phase 13D — Admin Operations & Control Center ===\n');

console.log('13D.1 Deliverables');
assert(
  exists('docs/audits/ADMIN_OPERATIONS_CONTROL_CENTER_PHASE13D_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE13D_ADMIN_OPERATIONS.md'),
  'progress doc',
);
assert(exists('scripts/validate-admin-operations-phase13d.ts'), 'validator');

const audit = read('docs/audits/ADMIN_OPERATIONS_CONTROL_CENTER_PHASE13D_AUDIT.md');

console.log('\n13D.2 All 16 audit sections');
for (const part of [
  'PART 1 — Admin surface inventory',
  'PART 2 — User administration',
  'PART 3 — Permission matrix',
  'PART 4 — Marketplace operations',
  'PART 5 — Subscription administration',
  'PART 6 — Promo codes',
  'PART 7 — Affiliate administration',
  'PART 8 — Delivery administration',
  'PART 9 — Trust & Safety',
  'PART 10 — Notifications',
  'PART 11 — SEO & growth administration',
  'PART 12 — Platform settings',
  'PART 13 — HCP administration',
  'PART 14 — Audit logging',
  'PART 15 — Founder operations',
  'PART 16 — Admin information architecture',
]) {
  assert(audit.includes(part), part);
}

console.log('\n13D.3 Permission matrix & route protection');
assert(audit.includes('Permission matrix'), 'permission matrix section');
assert(audit.includes('Route protection'), 'route protection audit');
assert(audit.includes('Privilege escalation'), 'privilege escalation review');
assert(audit.includes('SUPERADMIN'), 'SUPERADMIN covered');

console.log('\n13D.4 Domain CRUD audits');
for (const domain of [
  'Subscription administration',
  'Promo codes',
  'Affiliate administration',
  'Delivery administration',
  'Trust & Safety',
  'HCP administration',
  'Audit logging',
  'Platform settings',
]) {
  assert(audit.includes(domain), domain);
}

console.log('\n13D.5 SSOT discipline');
for (const ssot of [
  'visibility-profile.ts',
  'affiliate-config.ts',
  'affiliate-attribution-contract.ts',
  'lib/fees.ts',
  'deliveryPricing.ts',
]) {
  assert(audit.includes(ssot), `SSOT cited: ${ssot}`);
}
assert(audit.includes('No fake metrics') || audit.includes('no fake'), 'no fake metrics rule');

console.log('\n13D.6 Founder readiness verdict');
assert(
  audit.includes('Can Sergio operate') || audit.includes('Can Sergio run'),
  'founder question stated',
);
assert(audit.includes('Prisma Studio') || audit.includes('database'), 'blockers named');
assert(audit.includes('Final answer'), 'final answer section');

console.log('\n13D.7 P0–P3 classification');
for (const level of ['P0', 'P1', 'P2', 'P3']) {
  assert(audit.includes(level), `findings include ${level}`);
}

console.log('\n13D.8 Admin surfaces exist');
for (const f of [
  'components/admin/AdminDashboard.tsx',
  'components/admin/AdminCommandCenter.tsx',
  'app/api/admin/command-center/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/affiliates/route.ts',
  'app/api/admin/settings/route.ts',
  'components/admin/AffiliateManagement.tsx',
  'components/admin/PlatformSettings.tsx',
]) {
  assert(exists(f), f);
}

console.log('\n13D.9 Information architecture (no implementation)');
assert(audit.includes('Proposed navigation tree'), 'proposed nav tree');
assert(audit.includes('Merge opportunities'), 'merge opportunities');
assert(
  audit.includes('No implementation') || audit.includes('recommendation only'),
  'IA is recommendation only',
);

console.log('\n13D.10 Moderation & notifications audited');
assert(audit.includes('NotificationCenter') || audit.includes('Notifications'), 'notifications');
assert(audit.includes('ContentModerationDashboard') || audit.includes('moderation'), 'moderation');

console.log('\n13D.11 Chained validators');
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
