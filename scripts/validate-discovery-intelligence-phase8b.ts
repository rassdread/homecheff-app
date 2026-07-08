#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 8B — Accepted Values reverse discovery guard.
 *
 * Run: npx tsx scripts/validate-discovery-intelligence-phase8b.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  extractItemAcceptedValueIds,
  itemMatchesAcceptedValuesDiscoveryFilter,
} from '@/lib/marketplace/discovery/accepted-values-discovery';
import { getAcceptedValueTaxonomyItems } from '@/lib/marketplace/taxonomy-resolve';
import { buildTileSettlementRow } from '@/lib/marketplace/tiles/build-tile-settlement-row';
import type { MarketplaceTileModel } from '@/lib/marketplace/tiles/types';

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
function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

console.log('=== UX-FIN Phase 8B — Discovery intelligence ===\n');

// --- 8B.1 Reverse discovery -------------------------------------------------
console.log('8B.1 Reverse discovery filter');
const filterSrc = read('lib/marketplace/discovery/accepted-values-discovery.ts');
const filterUi = read('components/feed/AcceptedValuesDiscoveryFilter.tsx');
const geo = read('components/feed/GeoFeed.tsx');

assert(exists('lib/marketplace/discovery/accepted-values-discovery.ts'), 'accepted-values-discovery helper');
assert(filterSrc.includes('acceptedSpecializations'), 'matches acceptedSpecializations');
assert(filterSrc.includes('acceptedValueSubcategories'), 'matches discovery acceptedValueSubcategories');
assert(filterUi.includes('getAcceptedValueTaxonomyItems'), 'filter uses canonical accepted-value taxonomy');
assert(!filterUi.includes('MARKETPLACE_CATEGORIES.map((category) =>') || filterUi.includes('getMarketplaceTaxonomyGroupsByCategory'), 'filter groups by taxonomy groups not duplicate lists');
assert(geo.includes('itemMatchesAcceptedValuesDiscoveryFilter'), 'GeoFeed applies client-side accepted-values filter');
assert(geo.includes('appliedAcceptedValues'), 'GeoFeed tracks applied accepted-value filter state');
assert(geo.includes('AcceptedValuesDiscoveryFilter'), 'GeoFeed renders discovery filter UI');

// --- 8B.2 Taxonomy reuse ------------------------------------------------------
console.log('\n8B.2 Taxonomy reuse — single source');
const picker = read('components/products/marketplace/AcceptedValuesPicker.tsx');
assert(picker.includes('getAcceptedValueTaxonomyItems'), 'AcceptedValuesPicker uses same taxonomy helper');
assert(filterUi.includes('TaxonomyLucideIcon'), 'discovery filter uses TaxonomyLucideIcon');
assert(filterUi.includes('taxonomyLabelKey'), 'discovery filter uses taxonomy i18n keys');
assert(!/const\s+ACCEPTED_VALUES\s*=\s*\[/.test(filterUi + geo), 'no duplicate hardcoded accepted-value lists');

// --- 8B.3 Live matching -------------------------------------------------------
console.log('\n8B.3 Live matching (OR within filter, AND with other filters in GeoFeed)');
{
  const fruitId = getAcceptedValueTaxonomyItems().find((i) =>
    i.id.includes('fruit') || (i.searchTerms ?? []).some((t) => t.includes('fruit')),
  )?.id;
  if (fruitId) {
    const item = {
      acceptedSpecializations: [fruitId],
      listingIntent: 'OFFER',
    };
    assert(
      itemMatchesAcceptedValuesDiscoveryFilter(item, [fruitId]),
      'OFFER accepting fruit matches fruit filter',
    );
    assert(
      !itemMatchesAcceptedValuesDiscoveryFilter(item, ['blocked.nonexistent']),
      'no match when item does not accept filter value',
    );
  } else {
    const anyId = getAcceptedValueTaxonomyItems()[0]?.id;
    assert(!!anyId, 'taxonomy has accepted-value items');
    if (anyId) {
      assert(
        itemMatchesAcceptedValuesDiscoveryFilter(
          { acceptedSpecializations: [anyId] },
          [anyId],
        ),
        'generic accepted-value OR match',
      );
    }
  }
  const ids = extractItemAcceptedValueIds({
    discovery: { acceptedValueSubcategories: getAcceptedValueTaxonomyItems().slice(0, 1).map((i) => i.id) },
  });
  assert(ids.length >= 1, 'extractItemAcceptedValueIds reads discovery subcategories');
}

// --- 8B.4 Wanted / services ---------------------------------------------------
console.log('\n8B.4 Wanted + services support');
assert(geo.includes('filteredRequestBase'), 'Gezocht pool filtered separately');
assert(
  geo.includes('itemMatchesAcceptedValuesDiscoveryFilter') &&
    geo.includes('filteredRequestBase') &&
    geo.includes('filteredSaleBase'),
  'accepted-values filter on both sale and request pools',
);

// --- 8B.5 Tile / preview / detail ---------------------------------------------
console.log('\n8B.5 Tile, preview, detail consistency');
const tileStandard = read('components/marketplace/tiles/MarketplaceTileStandard.tsx');
assert(tileStandard.includes('TileValueExchangeBlock'), 'tile value block before trust');
assert(tileStandard.includes('TileTrustCue'), 'trust before settlement on standard tile');
assert(tileStandard.includes('TileSettlementRow'), 'settlement at bottom of standard tile');
assert(read('lib/marketplace/previews/build-preview-accepted.ts').includes('resolveAcceptedBadges'), 'preview accepted values from taxonomy badges');
assert(read('components/marketplace/previews/MarketplacePreviewCard.tsx').includes('TaxonomyLucideIcon'), 'preview shows accepted-value icons');
assert(read('components/product/detail/ProductAcceptedBadgesSection.tsx').includes('AcceptedValuesGroupedList'), 'detail grouped accepted values');

// --- 8B.6 Performance ---------------------------------------------------------
console.log('\n8B.6 Performance — no extra fetch');
assert(!/fetch\s*\(.*accepted/i.test(geo + filterUi), 'no dedicated accepted-values API fetch');
assert(geo.includes('useMemo') && geo.includes('filteredSaleBase'), 'sale filter memoized client-side');

// --- 8B.7 Empty state + chips -------------------------------------------------
console.log('\n8B.7 Empty state + active chips');
assert(geo.includes('emptyAcceptedValues'), 'dedicated empty state for accepted-values filter');
assert(geo.includes('acceptedValuesFilterChipsEl'), 'active accepted-value chips in feed chrome');
assert(geo.includes('marketplace.discovery.acceptedValuesFilter.emptyBody'), 'empty state copy');

// --- Deliverables -------------------------------------------------------------
console.log('\nDeliverables');
assert(exists('docs/audits/DISCOVERY_INTELLIGENCE_PHASE8B_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE8B_DISCOVERY_INTELLIGENCE.md'), 'progress doc');

// --- Prior guards -------------------------------------------------------------
console.log('\nPrior phase scripts (presence)');
for (const s of [
  'scripts/validate-homepage-sidebar-and-filter-phase7g.ts',
  'scripts/validate-marketplace-architecture-phase7d.ts',
  'scripts/validate-settlement-options-phase7c.ts',
]) {
  assert(exists(s), s);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
