#!/usr/bin/env npx tsx
/**
 * Phase 13O — Ethical Product Philosophy & Social Impact guard.
 *
 * Run: npx tsx scripts/validate-ethical-product-philosophy-phase13o.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

function main() {
  console.log('=== Phase 13O — Ethical Product Philosophy ===\n');

  console.log('13O.1 Deliverables');
  assert(
    exists('docs/audits/ETHICAL_PRODUCT_PHILOSOPHY_PHASE13O_AUDIT.md'),
    'audit doc',
  );
  assert(
    exists('docs/progress/UX_FINALIZATION_PHASE13O_ETHICAL_PRODUCT.md'),
    'progress doc',
  );
  assert(
    exists('scripts/validate-ethical-product-philosophy-phase13o.ts'),
    'validator',
  );

  const audit = read('docs/audits/ETHICAL_PRODUCT_PHILOSOPHY_PHASE13O_AUDIT.md');

  console.log('\n13O.2 Audit structure (16 parts)');
  const requiredSections = [
    'Part 1',
    'Part 2',
    'Part 3',
    'Part 4',
    'Part 5',
    'Part 6',
    'Part 7',
    'Part 8',
    'Part 9',
    'Part 10',
    'Part 11',
    'Part 12',
    'Part 13',
    'Part 14',
    'Part 15',
    'Part 16',
    'Founder verdict',
    'Ethical product scorecard',
  ];
  for (const section of requiredSections) {
    assert(audit.includes(section), `audit includes ${section}`);
  }

  console.log('\n13O.3 Evidence-backed mechanisms referenced');
  assert(exists('lib/discovery/activations/activation-safety.ts'), 'activation safety module');
  assert(exists('lib/business/visibility-profile.ts'), 'business visibility SSOT');
  assert(exists('lib/gamification/daily-login-hcp.ts'), 'HCP daily login');
  assert(exists('lib/notifications/notification-service.ts'), 'notification service');
  assert(exists('lib/account-deletion.ts'), 'account deletion');
  assert(exists('components/ConsentAwareAnalytics.tsx'), 'consent-gated analytics');

  const activationSafety = read('lib/discovery/activations/activation-safety.ts');
  assert(
    activationSafety.includes('no_pressure_mechanics'),
    'activation anti-pressure rules',
  );

  const visibility = read('lib/business/visibility-profile.ts');
  assert(
    visibility.includes('BUSINESS_VISIBILITY_RANK_CAP'),
    'paid visibility rank cap documented',
  );

  const dailyLogin = read('lib/gamification/daily-login-hcp.ts');
  assert(dailyLogin.includes('currentStreak'), 'streak mechanism present (audited)');

  const notifPrefs = read('app/api/notifications/preferences/route.ts');
  assert(
    notifPrefs.includes('pushPromotionalUpdates'),
    'promotional push preference exists',
  );

  console.log('\n13O.4 Findings classification');
  assert(audit.includes('P0'), 'P0 findings documented');
  assert(audit.includes('P1'), 'P1 findings documented');
  assert(audit.includes('Manipulative') || audit.includes('Risky'), 'attention audit classifications');
  assert(audit.includes('Healthy'), 'healthy mechanisms documented');

  console.log('\n13O.5 Scorecard honesty');
  assert(audit.includes('Ethical product scorecard'), 'scorecard section');
  assert(audit.includes('uncertainty') || audit.includes('Uncertainty'), 'score uncertainty noted');
  assert(
    !audit.includes('10/10') && !audit.match(/Score:\s*10\b/),
    'no inflated perfect scores',
  );

  console.log('\n13O.6 Roadmap horizons');
  assert(audit.includes('Before / during pilot') || audit.includes('before pilot'), 'pilot horizon');
  assert(audit.includes('30–90 days') || audit.includes('30-90'), 'evidence horizon');
  assert(audit.includes('Scale phase') || audit.includes('scale phase'), 'scale horizon');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
