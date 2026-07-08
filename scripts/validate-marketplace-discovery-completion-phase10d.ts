#!/usr/bin/env npx tsx
/**
 * Phase 10D — Marketplace discovery completion guard.
 *
 * Run: npx tsx scripts/validate-marketplace-discovery-completion-phase10d.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  itemMatchesAcceptedValuesDiscoveryFilter,
  taxonomyIdAllowedInDiscoveryFilter,
} from '@/lib/marketplace/discovery/accepted-values-discovery';
import { getAcceptedValueTaxonomyItems } from '@/lib/marketplace/taxonomy-resolve';
import {
  migrateHomeFilterPersist,
  snapshotHomeFilterPersist,
} from '@/lib/feed/home-filter-persist';
import { toPendingAcceptedValueId } from '@/lib/marketplace/pending-accepted-values/constants';

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

console.log('=== Phase 10D — Marketplace discovery completion ===\n');

// --- 10D.1 Deliverables -----------------------------------------------------
console.log('10D.1 Deliverables');
assert(
  exists('docs/audits/MARKETPLACE_DISCOVERY_COMPLETION_PHASE10D_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE10D_DISCOVERY_COMPLETION.md'),
  'progress doc',
);
assert(
  exists('scripts/audit-marketplace-discovery-completion-phase10d.ts'),
  'audit script',
);
assert(exists('lib/feed/home-filter-persist.ts'), 'home filter persist SSOT');

// --- 10D.2 Architecture regression (Part 11) --------------------------------
console.log('\n10D.2 Architecture regression');
for (const f of [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
  'lib/marketplace/discovery/accepted-values-discovery.ts',
  'lib/marketplace/discovery/reverse-discovery-session.ts',
  'lib/marketplace/tiles/map-to-tile-model.ts',
]) {
  assert(exists(f), f);
}
assert(
  !read('lib/marketplace/canonical-model.ts').includes('Phase 10D'),
  'no 10D stamp in canonical-model',
);

// --- 10D.3 Legacy migration (Part 1–2) --------------------------------------
console.log('\n10D.3 Legacy migration');
assert(
  exists('lib/marketplace/normalization/propose-product-normalization.ts'),
  'normalization SSOT',
);
assert(
  exists('scripts/backfill-marketplace-data-normalization-phase10c.ts'),
  'backfill script (10C)',
);

// --- 10D.4 Filter consistency (Part 3–4) ------------------------------------
console.log('\n10D.4 Filter consistency');
const geo = read('components/feed/GeoFeed.tsx');
const sidebar = read('components/feed/FeedSidebarFilters.tsx');
const mobile = read('components/feed/FeedMobileFilterSheet.tsx');
const page = read('app/page.tsx');

assert(geo.includes('migrateHomeFilterPersist'), 'GeoFeed uses filter persist SSOT');
assert(geo.includes('snapshotHomeFilterPersist'), 'GeoFeed snapshots persist fields');
assert(
  sidebar.includes('AcceptedValuesDiscoveryFilter') &&
    !sidebar.includes("discoveryDirection === 'want'"),
  'sidebar: accepted values not hidden in refine',
);
assert(
  mobile.includes('onScopeChange') && mobile.includes('FEED_SCOPE_NEARBY'),
  'mobile filter: scope parity',
);
assert(
  !geo.includes("discoveryDirection === 'want'"),
  'GeoFeed: no want-only accepted values in refine',
);
assert(page.includes('migrateLegacyServicesViewChip'), 'homepage legacy chip migration');
assert(page.includes('normalizeDiscoveryCategorySlug'), 'homepage category normalize');

// --- 10D.5 Discovery correctness (Part 5) -------------------------------------
console.log('\n10D.5 Discovery correctness');
assert(
  geo.includes('itemMatchesAcceptedValuesDiscoveryFilter'),
  'GeoFeed uses accepted-values discovery SSOT',
);
assert(
  geo.includes('itemMatchesDiscoveryCategorySlug'),
  'GeoFeed uses canonical category matcher',
);
assert(
  geo.includes('DISCOVERY_VIEW_CHIP_OPTIONS') && geo.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'),
  'view + category chips from canonical model',
);

// --- 10D.6 Reverse discovery quality (Part 6) -------------------------------
console.log('\n10D.6 Reverse discovery scenarios');
const scenarios = [
  'grow.fruit',
  'design.photo',
  'artistic.nails',
  'practical.movinghelp',
  'knowledge.coaching',
  'practical.gardenwork',
  'practical.handyman',
] as const;
const acceptedItems = getAcceptedValueTaxonomyItems();
for (const id of scenarios) {
  assert(acceptedItems.some((i) => i.id === id), `taxonomy: ${id}`);
  assert(taxonomyIdAllowedInDiscoveryFilter(id), `discovery allows: ${id}`);
  assert(
    itemMatchesAcceptedValuesDiscoveryFilter(
      { acceptedSpecializations: [id] },
      [id],
    ),
    `OR match: ${id}`,
  );
}

// --- 10D.7 Accepted values ecosystem (Part 7) ---------------------------------
console.log('\n10D.7 Accepted values ecosystem');
assert(exists('components/marketplace/AcceptedValueChip.tsx'), 'AcceptedValueChip');
assert(
  read('components/feed/AcceptedValuesDiscoveryFilter.tsx').includes(
    'PendingAcceptedValueProposalForm',
  ),
  'discovery filter: pending proposals',
);
{
  const pendingId = toPendingAcceptedValueId('10d-test');
  assert(
    itemMatchesAcceptedValuesDiscoveryFilter(
      { acceptedSpecializations: [pendingId] },
      [pendingId],
    ),
    'pending id OR match',
  );
}

// --- 10D.8 Value economy prominence (Part 8) ----------------------------------
console.log('\n10D.8 Value economy prominence');
const nl = read('public/i18n/nl.json');
assert(nl.includes('marketplace.discovery.usp.tagline') || nl.includes('Shop niet alleen met geld'), 'NL USP tagline');
assert(read('components/home/HomeHeroSection.tsx').includes('heroValueExchange'), 'hero value exchange');
assert(read('components/feed/DiscoveryDirectionToggle.tsx').includes('showTagline'), 'direction toggle tagline');

// --- 10D.9 Filter persistence (Part 9) ----------------------------------------
console.log('\n10D.9 Filter persistence');
{
  const snap = snapshotHomeFilterPersist({
    feedChip: 'sale',
    appliedRadius: 25,
    appliedScope: 'national',
    appliedCategory: 'services',
    appliedSortBy: 'newest',
    appliedSortOrder: 'desc',
    appliedSearchQuery: '',
    appliedQ: '',
    appliedPlace: 'Utrecht',
    appliedPriceRange: { min: '', max: '' },
    showFilters: false,
    discoveryDirection: 'offer',
    appliedAcceptedValues: ['grow.fruit'],
  });
  const restored = migrateHomeFilterPersist({
    ...snap,
    feedChip: 'services',
    nationalView: true,
  });
  assert(restored.feedChip === 'sale', 'persist migrates legacy services chip');
  assert(restored.category === 'services', 'persist keeps services category');
  assert(restored.discoveryDirection === 'offer', 'persist restores discovery direction');
  assert(
    restored.acceptedValues.includes('grow.fruit'),
    'persist restores accepted values',
  );
}
assert(
  geo.includes('discoveryDirection') && geo.includes('appliedAcceptedValues'),
  'GeoFeed save effect includes new persist fields',
);

// --- 10D.10 First impression (Part 10) ----------------------------------------
console.log('\n10D.10 First impression');
assert(nl.includes('heroValueExchange'), 'NL hero value exchange');
assert(nl.includes('Betaal veilig via HomeCheff Checkout'), 'NL settlement intro on detail');
assert(read('components/products/marketplace/MarketplaceOfferForm.tsx').includes('settlementIntro'), 'create form settlement intro');

// --- 10D.11 Sidebar validation (Part 4) ---------------------------------------
console.log('\n10D.11 Sidebar');
assert(
  read('components/home/HomeDesktopLeftSidebar.tsx').includes('FeedFiltersPanel'),
  'desktop sidebar uses FeedFiltersPanel',
);
assert(sidebar.includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'), 'sidebar uses canonical categories');

// --- 10D.12 Chained validators ------------------------------------------------
console.log('\n10D.12 Chained validators');
for (const script of [
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
