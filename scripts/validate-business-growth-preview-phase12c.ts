#!/usr/bin/env npx tsx
/**
 * Phase 12C — Live subscription preview & growth transparency guard.
 *
 * Run: npx tsx scripts/validate-business-growth-preview-phase12c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  buildLivePreviewFields,
  computeUpgradeDelta,
  computeVisibilityScore,
  listImmediateUpgradeBenefits,
  listLockedFeatureKeys,
} from '../lib/business/dna-preview';
import { buildDnaPreviewTileModel } from '../lib/business/dna-preview-tile';
import { buildSubscriptionComparisonRows } from '../lib/business/subscription-comparison';
import { getBusinessVisibilityProfile } from '../lib/business/visibility-profile';

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

const PRIOR = ['scripts/validate-business-dna-phase12b.ts'];

console.log('=== Phase 12C — Growth Preview ===\n');

console.log('12C.1 Deliverables');
assert(exists('docs/audits/BUSINESS_GROWTH_PREVIEW_PHASE12C_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE12C_GROWTH_PREVIEW.md'),
  'progress doc',
);
assert(exists('scripts/validate-business-growth-preview-phase12c.ts'), 'validator');

console.log('\n12C.2 DNA preview library');
assert(exists('lib/business/dna-preview.ts'), 'dna-preview.ts');
assert(exists('lib/business/dna-preview-tile.ts'), 'dna-preview-tile.ts');
assert(
  read('lib/business/dna-preview.ts').includes('getBusinessVisibilityProfile'),
  'preview uses DNA SSOT',
);

const basicFields = buildLivePreviewFields('basic');
assert(basicFields.length >= 10, 'live preview fields');
assert(computeVisibilityScore(getBusinessVisibilityProfile('premium')) > computeVisibilityScore(getBusinessVisibilityProfile('individual')), 'premium score > individual');

const delta = computeUpgradeDelta('basic', 'pro');
assert(delta.some((d) => d.key.includes('regional') || d.key.includes('homepage')), 'basic→pro delta');
assert(computeUpgradeDelta('pro', 'pro').length === 0, 'same plan empty delta');
assert(listImmediateUpgradeBenefits('basic').length > 0, 'individual→basic benefits');

console.log('\n12C.3 UI components');
for (const f of [
  'components/business/SubscriptionLivePreview.tsx',
  'components/business/SubscriptionWhatChangesPanel.tsx',
  'components/business/BusinessDnaDashboardWidget.tsx',
  'components/business/BusinessDnaProductPreview.tsx',
]) {
  assert(exists(f), f);
  assert(read(f).includes('getBusinessVisibilityProfile') || read(f).includes('dna-preview'), `${f} reads DNA`);
}

console.log('\n12C.4 Sell page live preview');
const sell = read('app/sell/page.tsx');
assert(sell.includes('SubscriptionLivePreview'), 'sell live preview');
assert(sell.includes('BusinessDnaProductPreview'), 'sell product preview');
assert(sell.includes('SubscriptionWhatChangesPanel'), 'sell what changes');
assert(sell.includes('onPreviewPlan'), 'sell plan hover preview');

console.log('\n12C.5 Dashboard widget');
const dash = read('app/verkoper/dashboard/page-client.tsx');
assert(dash.includes('BusinessDnaDashboardWidget'), 'dashboard DNA widget');
assert(dash.includes('businessPlan'), 'dashboard reads businessPlan from stats');

console.log('\n12C.6 Product preview uses real tile');
const tile = buildDnaPreviewTileModel('pro', 'Test');
assert(tile.trust.businessPlan === 'pro', 'preview tile businessPlan');
assert(read('components/business/BusinessDnaProductPreview.tsx').includes('MarketplaceTileCompact'), 'real tile component');

console.log('\n12C.7 Comparison + locked features from DNA');
assert(buildSubscriptionComparisonRows().length >= 10, 'comparison from DNA');
assert(listLockedFeatureKeys('individual').length > 0, 'locked features for individual');

console.log('\n12C.8 No duplicate plan tables');
assert(!exists('lib/business/subscription-features-v2.ts'), 'no parallel feature table');

console.log('\n12C.9 Chained validators');
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
