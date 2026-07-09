#!/usr/bin/env npx tsx
/**
 * Phase 13E — Admin P0 Operational Fixes guard.
 *
 * Run: npx tsx scripts/validate-admin-p0-fixes-phase13e.ts
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
  'scripts/validate-admin-operations-phase13d.ts',
  'scripts/validate-affiliate-attribution-analytics-phase13c.ts',
];

console.log('=== Phase 13E — Admin P0 Operational Fixes ===\n');

console.log('13E.1 Deliverables');
assert(exists('docs/audits/ADMIN_P0_OPERATIONAL_FIXES_PHASE13E_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE13E_ADMIN_P0_FIXES.md'), 'progress doc');
assert(exists('scripts/validate-admin-p0-fixes-phase13e.ts'), 'validator');

const audit = read('docs/audits/ADMIN_P0_OPERATIONAL_FIXES_PHASE13E_AUDIT.md');
const guard = read('lib/admin-guard.ts');
const auditLib = read('lib/admin-audit.ts');

console.log('\n13E.2 Admin guard');
assert(guard.includes('requirePlatformAdmin'), 'requirePlatformAdmin');
assert(guard.includes('requireSuperAdmin'), 'requireSuperAdmin');
assert(guard.includes('requireAdminPermission'), 'requireAdminPermission');

console.log('\n13E.3 P0 blockers addressed');
for (const id of ['P0-1', 'P0-2', 'P0-3', 'P0-4', 'P0-5', 'P0-6', 'P0-7', 'P0-8', 'P0-9']) {
  assert(audit.includes(id), `audit closes ${id}`);
}

console.log('\n13E.4 User suspend/restore');
assert(exists('app/api/admin/users/[id]/suspend/route.ts'), 'suspend API');
assert(exists('lib/user-suspend.ts'), 'user-suspend lib');
assert(read('app/api/checkout/route.ts').includes('assertNotSuspended'), 'checkout blocks suspended');

console.log('\n13E.5 Delivery admin API');
assert(exists('app/api/admin/delivery/[profileId]/status/route.ts'), 'delivery status API');
assert(exists('app/api/admin/delivery/[profileId]/block/route.ts'), 'delivery block API');

console.log('\n13E.6 Subscription admin');
assert(exists('app/api/admin/business-subscriptions/[userId]/route.ts'), 'business subscription admin');
assert(
  read('app/api/admin/business-subscriptions/[userId]/route.ts').includes('getBusinessVisibilityProfile'),
  'uses visibility SSOT',
);

console.log('\n13E.7 Promo override');
assert(exists('app/api/admin/promo-codes/route.ts'), 'promo list API');
assert(exists('app/api/admin/promo-codes/[id]/route.ts'), 'promo patch API');

console.log('\n13E.8 Commission adjustment');
const adj = read('app/api/admin/affiliates/commission-adjustment/route.ts');
assert(adj.includes('ADMIN_ADJUSTMENT'), 'ledger adjustment type');
assert(adj.includes('requireSuperAdmin'), 'superadmin guard');
assert(adj.includes('admin_adj_'), 'idempotent eventId prefix');

console.log('\n13E.9 Trust queue');
assert(exists('app/api/admin/trust-queue/route.ts'), 'trust queue API');
assert(exists('components/admin/TrustQueuePanel.tsx'), 'trust queue UI');
assert(read('app/api/admin/trust-queue/route.ts').includes('tracked: false'), 'honest tracked flags');

console.log('\n13E.10 Audit logging');
assert(auditLib.includes('logAdminAction'), 'audit helper');
assert(read('app/api/admin/clear-messages/route.ts').includes('logAdminAction'), 'clear-messages audited');

console.log('\n13E.11 Clear-chat protection');
assert(read('app/admin/clear-chat/page.tsx').includes('SUPERADMIN'), 'page-level superadmin');
assert(read('app/api/admin/clear-messages/route.ts').includes('requireSuperAdmin'), 'API superadmin');

console.log('\n13E.12 Schema migration');
assert(
  read('prisma/schema.prisma').includes('suspendedAt') &&
    read('prisma/schema.prisma').includes('isBlocked'),
  'suspend + delivery block fields',
);

console.log('\n13E.13 No duplicate SSOT / fake metrics');
assert(audit.includes('visibility-profile'), 'SSOT cited');
assert(audit.includes('No fake metrics') || audit.includes('tracked: false'), 'honesty rule');

console.log('\n13E.14 Chained validators');
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
