#!/usr/bin/env npx tsx
/**
 * Phase 13G — Pilot Readiness & Operational Excellence guard.
 *
 * Run: npx tsx scripts/validate-pilot-readiness-phase13g.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { ALL_ADMIN_TAB_IDS } from '../lib/founder-control-center/navigation';

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
  'scripts/validate-founder-control-center-phase13f.ts',
  'scripts/validate-admin-p0-fixes-phase13e.ts',
];

const PILOT_CITIES = ['Vlaardingen', 'Schiedam', 'Rotterdam'];

const PRODUCT_MODULES = [
  'Homepage',
  'Geo Feed',
  'Marketplace',
  'Checkout',
  'Orders',
  'Chat',
  'Business DNA',
  'Affiliate',
  'Delivery',
  'Founder Control Center',
  'Mobile',
];

const JOURNEY_ROLES = ['Buyer', 'Seller', 'Business', 'Affiliate', 'Courier', 'Admin'];

const SCORE_DOMAINS = [
  'Marketplace',
  'Business DNA',
  'Seller Experience',
  'Buyer Experience',
  'Delivery',
  'Affiliate',
  'Trust & Safety',
  'Founder Control Center',
  'Overall Pilot Readiness',
];

console.log('=== Phase 13G — Pilot Readiness & Operational Excellence ===\n');

console.log('13G.1 Deliverables');
assert(exists('docs/audits/PILOT_READINESS_PHASE13G_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE13G_PILOT_READINESS.md'), 'progress doc');
assert(exists('scripts/validate-pilot-readiness-phase13g.ts'), 'validator');

const audit = read('docs/audits/PILOT_READINESS_PHASE13G_AUDIT.md');
const progress = read('docs/progress/UX_FINALIZATION_PHASE13G_PILOT_READINESS.md');

console.log('\n13G.2 Audit sections (Parts 1–11)');
for (const part of [
  'PART 1 — Complete product audit',
  'PART 2 — User journey audit',
  'PART 3 — UX polish audit',
  'PART 4 — Dashboard completeness',
  'PART 5 — Operational readiness',
  'PART 6 — Performance audit',
  'PART 7 — Pilot telemetry',
  'PART 8 — Founder pilot dashboard',
  'PART 9 — Stress readiness',
  'PART 10 — Production readiness checklist',
  'PART 11 — Success scores',
]) {
  assert(audit.includes(part), part);
}

console.log('\n13G.3 Pilot geography');
for (const city of PILOT_CITIES) {
  assert(audit.includes(city), `pilot city: ${city}`);
}

console.log('\n13G.4 Product modules audited');
for (const mod of PRODUCT_MODULES) {
  assert(audit.includes(mod.split(' ')[0]) || audit.toLowerCase().includes(mod.toLowerCase()), `module: ${mod}`);
}

console.log('\n13G.5 User journeys by role');
for (const role of JOURNEY_ROLES) {
  assert(audit.includes(role), `role journey: ${role}`);
}

console.log('\n13G.6 Founder verdict');
const validVerdicts = [
  'Ready to launch',
  'Ready with acceptable risks',
  'Launch after P1 fixes',
  'Not ready',
];
assert(
  validVerdicts.some((v) => audit.includes(v)),
  'founder verdict present',
);
assert(
  audit.includes('🟡') || audit.includes('✅') || audit.includes('🟠') || audit.includes('🔴'),
  'verdict emoji marker',
);
assert(progress.includes('acceptable risks') || progress.includes('Ready'), 'progress doc verdict');

console.log('\n13G.7 Priority classification');
for (const pri of ['P0', 'P1', 'P2', 'P3']) {
  assert(audit.includes(pri), `priority class ${pri}`);
}

console.log('\n13G.8 Success scores');
for (const domain of SCORE_DOMAINS) {
  assert(audit.includes(domain), `score domain: ${domain}`);
}

console.log('\n13G.9 No fake metrics / SSOT discipline');
assert(audit.includes('No fake') || audit.includes('not tracked') || audit.includes('notTracked'), 'honesty rule');
assert(audit.includes('settlement-router.ts'), 'settlement SSOT');
assert(audit.includes('visibility-profile.ts'), 'business DNA SSOT');
assert(audit.includes('affiliate-attribution-contract.ts'), 'attribution SSOT');
assert(audit.includes('founder-control-center/navigation.ts'), 'FCC navigation SSOT');

console.log('\n13G.10 Stub routes documented');
assert(audit.includes('/reservations'), 'reservations stub documented');
assert(audit.includes('/place'), 'place stub documented');

console.log('\n13G.11 Operational external tools classified');
assert(audit.includes('Required by design') || audit.includes('external'), 'external tools classified');
assert(audit.includes('Stripe'), 'Stripe dependency documented');

console.log('\n13G.12 Admin functionality preserved (13F)');
assert(ALL_ADMIN_TAB_IDS.length === 22, '22 admin tabs preserved');

console.log('\n13G.13 Dashboard philosophy');
assert(audit.includes('What happened') || audit.includes('What is happening'), 'dashboard framework');

console.log('\n13G.14 Telemetry funnel');
assert(audit.includes('Registration') || audit.includes('registration'), 'registration funnel');
assert(audit.includes('First order') || audit.includes('first order'), 'order funnel step');

console.log('\n13G.15 Chained validators');
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
