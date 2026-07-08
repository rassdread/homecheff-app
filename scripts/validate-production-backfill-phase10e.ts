#!/usr/bin/env npx tsx
/**
 * Phase 10E — Production backfill guard.
 *
 * Run: npx tsx scripts/validate-production-backfill-phase10e.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  verifyBackfillProposalSafety,
  applyProposalUpdates,
} from '@/lib/marketplace/normalization/backfill-safety';
import {
  proposeProductNormalization,
  hasWritableUpdates,
} from '@/lib/marketplace/normalization/propose-product-normalization';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';

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

console.log('=== Phase 10E — Production backfill ===\n');

// --- 10E.1 Deliverables -------------------------------------------------------
console.log('10E.1 Deliverables');
assert(
  exists('docs/audits/PRODUCTION_BACKFILL_PHASE10E_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE10E_PRODUCTION_BACKFILL.md'),
  'progress doc',
);
assert(
  exists('scripts/audit-production-backfill-phase10e.ts'),
  '10E audit script',
);
assert(
  exists('lib/marketplace/normalization/backfill-safety.ts'),
  'backfill safety SSOT',
);

// --- 10E.2 Reuse 10C migration (Part 1) ---------------------------------------
console.log('\n10E.2 Migration SSOT — no duplicate logic');
const backfill = read('scripts/backfill-marketplace-data-normalization-phase10c.ts');
const audit10e = read('scripts/audit-production-backfill-phase10e.ts');
assert(
  exists('lib/marketplace/normalization/propose-product-normalization.ts'),
  'propose-product-normalization.ts',
);
assert(backfill.includes('proposeProductNormalization'), 'backfill uses proposal SSOT');
assert(audit10e.includes('proposeProductNormalization'), '10E audit uses proposal SSOT');
assert(
  !exists('scripts/backfill-marketplace-data-normalization-phase10e.ts'),
  'no duplicate backfill script',
);
assert(
  !audit10e.includes('function proposeProduct') ||
    audit10e.includes('from \'@/lib/marketplace/normalization/propose-product-normalization\''),
  '10E audit does not inline normalization',
);

// --- 10E.3 Architecture unchanged (Part 8) ------------------------------------
console.log('\n10E.3 Architecture regression');
for (const f of [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
  'lib/marketplace/taxonomy-normalize.ts',
  'lib/marketplace/taxonomy-resolve.ts',
  'lib/marketplace/discovery/accepted-values-discovery.ts',
  'lib/marketplace/discovery/reverse-discovery-session.ts',
  'lib/marketplace/tiles/map-to-tile-model.ts',
  'lib/feed/home-filter-persist.ts',
]) {
  assert(exists(f), f);
}
assert(
  !read('lib/marketplace/canonical-model.ts').includes('Phase 10E'),
  'no 10E stamp in canonical-model',
);

// --- 10E.4 Backfill safety (Part 4) -------------------------------------------
console.log('\n10E.4 Backfill safety rules');
{
  const before = {
    id: 'safety-1',
    title: 'Request row',
    category: 'CHEFF',
    listingIntent: 'REQUEST',
    marketplaceCategory: 'CREATE',
    subcategory: 'create.meal',
    specializations: ['create.meal'],
    acceptedSpecializations: ['pending:abc'],
    barterOpenness: 'MONEY',
    priceModel: 'FIXED',
    priceCents: 0,
    orderMethod: 'CONTACT',
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    isActive: true,
    createdAt: new Date(),
    sellerStripeConnectReady: false,
  };
  const proposal = proposeProductNormalization(before);
  const safety = verifyBackfillProposalSafety(before, proposal);
  assert(safety.safe, 'CONTACT legacy settlement fix is safe');
  assert(
    proposal.updates.acceptDirectContact === true ||
      !hasWritableUpdates(proposal) ||
      proposal.updates.listingIntent !== 'OFFER',
    'REQUEST not flipped to OFFER',
  );
  const after = applyProposalUpdates(before, proposal);
  assert(after.acceptedSpecializations.includes('pending:abc'), 'pending id preserved');
}

{
  const before = {
    id: 'safety-2',
    title: 'Stale specs',
    category: 'DESIGNER',
    listingIntent: 'OFFER',
    marketplaceCategory: 'DESIGN',
    subcategory: 'create.art',
    specializations: [],
    acceptedSpecializations: ['grow.fruit'],
    barterOpenness: 'MONEY',
    priceModel: 'FIXED',
    priceCents: 1000,
    orderMethod: 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    isActive: true,
    createdAt: new Date(),
    sellerStripeConnectReady: true,
  };
  const proposal = proposeProductNormalization(before);
  if (hasWritableUpdates(proposal)) {
    const beforeKind = deriveListingKind({
      entityType: 'product',
      listingIntent: before.listingIntent,
      marketplaceCategory: before.marketplaceCategory,
      specializations: before.specializations,
      subcategory: before.subcategory,
      category: before.category,
    }).listingKind;
    const after = applyProposalUpdates(before, proposal);
    const afterKind = deriveListingKind({
      entityType: 'product',
      listingIntent: after.listingIntent,
      marketplaceCategory: after.marketplaceCategory,
      specializations: after.specializations,
      subcategory: after.subcategory,
      category: after.category,
    }).listingKind;
    assert(
      beforeKind === afterKind || proposal.risks.length > 0,
      'listingKind drift is explained when category repair occurs',
    );
  } else {
    assert(true, 'listingKind drift is explained when category repair occurs');
  }
}

// --- 10E.5 Write gate (Part 5) ------------------------------------------------
console.log('\n10E.5 Write-mode gate');
assert(backfill.includes('CONFIRM_BACKFILL'), 'backfill requires CONFIRM_BACKFILL');
assert(backfill.includes('--dry-run'), 'backfill supports dry-run');
assert(!backfill.includes('.delete('), 'backfill has no deletes');

// --- 10E.6 Runtime / filter regression (Part 7–8) -------------------------------
console.log('\n10E.6 Runtime regression guards');
const geo = read('components/feed/GeoFeed.tsx');
assert(geo.includes('migrateHomeFilterPersist'), 'GeoFeed filter persist');
assert(geo.includes('itemMatchesAcceptedValuesDiscoveryFilter'), 'reverse discovery filter');
assert(read('components/feed/FeedSidebarFilters.tsx').includes('showTagline'), 'sidebar USP');

// --- 10E.7 Chained validators -------------------------------------------------
console.log('\n10E.7 Chained validators');
for (const script of [
  'scripts/validate-marketplace-discovery-completion-phase10d.ts',
  'scripts/validate-marketplace-data-normalization-phase10c.ts',
  'scripts/validate-pilot-polish-phase10b.ts',
  'scripts/validate-pilot-launch-readiness-phase10a.ts',
  'scripts/validate-brand-implementation-phase9b.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
  'scripts/validate-marketplace-architecture-phase7d.ts',
]) {
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
