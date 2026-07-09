#!/usr/bin/env npx tsx
/**
 * Phase 13F — Founder Control Center UX & IA guard.
 *
 * Run: npx tsx scripts/validate-founder-control-center-phase13f.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  ADMIN_DOMAIN_DEFINITIONS,
  ADMIN_TAB_DEFINITIONS,
  ALL_ADMIN_TAB_IDS,
  STANDALONE_ADMIN_ROUTES,
} from '../lib/founder-control-center/navigation';

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
  'scripts/validate-admin-p0-fixes-phase13e.ts',
  'scripts/validate-admin-operations-phase13d.ts',
  'scripts/validate-affiliate-attribution-analytics-phase13c.ts',
];

/** Tab IDs that existed before 13F — must remain reachable. */
const LEGACY_TAB_IDS = [
  'command-center',
  'overview',
  'orders',
  'financial',
  'disputes',
  'settings',
  'audit',
  'users',
  'messages',
  'sellers',
  'products',
  'delivery',
  'live-locations',
  'analytics',
  'promo-analytics',
  'login-analytics',
  'variabelen',
  'geographic',
  'moderation',
  'notifications',
  'affiliates',
  'admin-management',
];

const STANDALONE_PATHS = [
  '/admin/profile',
  '/admin/beta',
  '/admin/hcp',
  '/admin/hcp-carousel',
  '/admin/variabelen',
  '/admin/clear-chat',
];

console.log('=== Phase 13F — Founder Control Center UX & IA ===\n');

console.log('13F.1 Deliverables');
assert(
  exists('docs/audits/FOUNDER_CONTROL_CENTER_INFORMATION_ARCHITECTURE_PHASE13F_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE13F_FOUNDER_CONTROL_CENTER.md'),
  'progress doc',
);
assert(exists('scripts/validate-founder-control-center-phase13f.ts'), 'validator');
assert(exists('lib/founder-control-center/navigation.ts'), 'navigation SSOT');
assert(exists('components/admin/FounderControlCenterShell.tsx'), 'shell component');

const audit = read('docs/audits/FOUNDER_CONTROL_CENTER_INFORMATION_ARCHITECTURE_PHASE13F_AUDIT.md');
const nav = read('lib/founder-control-center/navigation.ts');
const dashboard = read('components/admin/AdminDashboard.tsx');

console.log('\n13F.2 Audit sections (Parts 1–16)');
for (const part of [
  'PART 1 — Full navigation audit',
  'PART 2 — Information Architecture',
  'PART 3 — Entity-first workflow',
  'PART 4 — Founder workflow audit',
  'PART 5 — Support workflow',
  'PART 6 — Operations workflow',
  'PART 7 — Navigation simplification',
  'PART 8 — Context awareness',
  'PART 9 — Dashboard philosophy',
  'PART 10 — Visual hierarchy',
  'PART 11 — Future scalability',
  'PART 12 — Founder Control Center vision',
  'PART 13 — Safe implementation',
  'PART 14 — Deliverables',
  'PART 15 — Final completeness audit',
  'PART 16 — UX friction audit',
]) {
  assert(audit.includes(part), part);
}

console.log('\n13F.3 Workflow documentation');
assert(audit.includes('Founder workflow'), 'founder workflow documented');
assert(audit.includes('Support workflow'), 'support workflow documented');
assert(audit.includes('Operations workflow'), 'operations workflow documented');
assert(audit.includes('Dashboard philosophy'), 'dashboard philosophy documented');
assert(audit.includes('Future scalability'), 'future scalability documented');
assert(audit.includes('orphan'), 'orphan pages documented');

console.log('\n13F.4 All admin functionality still reachable');
for (const tabId of LEGACY_TAB_IDS) {
  assert(ALL_ADMIN_TAB_IDS.includes(tabId as (typeof ALL_ADMIN_TAB_IDS)[number]), `tab preserved: ${tabId}`);
}
assert(LEGACY_TAB_IDS.length === ALL_ADMIN_TAB_IDS.length, 'tab count unchanged (22)');

console.log('\n13F.5 IA domains');
assert(ADMIN_DOMAIN_DEFINITIONS.length === 9, 'nine domains');
for (const domain of [
  'command-center',
  'community',
  'marketplace',
  'finance',
  'logistics',
  'growth',
  'trust',
  'insights',
  'platform',
]) {
  assert(
    ADMIN_DOMAIN_DEFINITIONS.some((d) => d.id === domain),
    `domain: ${domain}`,
  );
}

console.log('\n13F.6 Standalone orphan routes documented');
for (const routePath of STANDALONE_PATHS) {
  assert(
    STANDALONE_ADMIN_ROUTES.some((r) => r.path === routePath),
    `standalone: ${routePath}`,
  );
  assert(audit.includes(routePath), `audit mentions ${routePath}`);
}

console.log('\n13F.7 Duplicate navigation reduced');
assert(
  audit.includes('promo-analytics') && audit.includes('Insights'),
  'analytics duplicates grouped in audit',
);
assert(nav.includes('CONSOLIDATED_ANALYTICS_TAB_IDS'), 'analytics consolidation documented in SSOT');

console.log('\n13F.8 Implementation matches approved IA');
assert(dashboard.includes('FounderControlCenterShell'), 'dashboard uses shell');
assert(dashboard.includes('founder-control-center/navigation'), 'dashboard uses navigation SSOT');
assert(dashboard.includes('buildAdminTabHref'), 'bookmark-compatible URLs');
assert(nav.includes('resolveAdminNavigation'), 'URL resolver');

console.log('\n13F.9 No duplicate SSOT / architecture regression');
assert(!dashboard.includes('ADMIN_ROLE_TAB_MAPPING'), 'tab-domain map not duplicated in dashboard');
assert(nav.includes('Do not duplicate'), 'SSOT comment in navigation');
assert(audit.includes('visibility-profile'), 'business SSOT cited');
assert(audit.includes('affiliate-attribution-contract'), 'attribution SSOT cited');

console.log('\n13F.10 i18n');
const en = read('public/i18n/en.json');
const nl = read('public/i18n/nl.json');
assert(en.includes('"fcc"') && en.includes('Founder Control Center'), 'en FCC strings');
assert(nl.includes('"fcc"') && nl.includes('Founder Control Center'), 'nl FCC strings');

console.log('\n13F.11 Chained validators');
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
