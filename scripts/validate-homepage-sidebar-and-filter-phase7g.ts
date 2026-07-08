#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7G — Sidebar dedup, legacy settlement fallback & filter speed.
 *
 * Run: npx tsx scripts/validate-homepage-sidebar-and-filter-phase7g.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  resolveSettlementOptions,
  isLegacyPricedCheckoutEligible,
} from '@/lib/marketplace/settlement/settlement-options';
import { buildTileSettlementRow } from '@/lib/marketplace/tiles/build-tile-settlement-row';
import type { MarketplaceTileModel } from '@/lib/marketplace/tiles/types';
import {
  SIDEBAR_CTA_PRIORITY,
  resolveSidebarDeliveryCtaSuppression,
  planShowsDeliveryEconomyOpportunity,
} from '@/lib/home/sidebar-cta-priority';

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
function json(rel: string): Record<string, unknown> {
  try {
    return JSON.parse(read(rel));
  } catch {
    return {};
  }
}
function get(obj: Record<string, unknown>, dotted: string): unknown {
  return dotted.split('.').reduce(
    (acc: unknown, k) =>
      acc != null && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[k]
        : undefined,
    obj,
  );
}

console.log('=== UX-FIN Phase 7G — Sidebar + filter polish ===\n');

// --- 7G.1 / 7G.2 Sidebar delivery CTA dedup ----------------------------------
console.log('7G.1–7G.2 Sidebar delivery CTA dedup + priority');
const sidebar = read('components/home/HomeDesktopSidebar.tsx');
const promos = read('components/home/HomeRecommendedPromotions.tsx');
const oppStack = read('components/discovery/surfaces/OpportunitySurfaceStack.tsx');
const surfaceStack = read('components/discovery/surfaces/DesktopRightSidebarSurfaceStack.tsx');
const ctaPriority = read('lib/home/sidebar-cta-priority.ts');

assert(exists('lib/home/sidebar-cta-priority.ts'), 'sidebar CTA priority module exists');
assert(SIDEBAR_CTA_PRIORITY.includes('delivery_signup'), 'priority list documents delivery_signup');
assert(ctaPriority.includes('stripe_connect'), 'priority documents Stripe Connect first');
assert(sidebar.includes('resolveSidebarDeliveryCtaSuppression'), 'right sidebar resolves CTA suppression');
assert(sidebar.includes('suppressedPromotionIds'), 'promotions receive suppression list');
assert(promos.includes('suppressedPromotionIds'), 'HomeRecommendedPromotions filters suppressed promos');
assert(oppStack.includes('suppressEconomyCourier'), 'OpportunitySurfaceStack can hide duplicate COURIER');
assert(surfaceStack.includes('BECOME_COURIER'), 'activity stack filters duplicate become-courier card');
assert(
  sidebar.includes('GrowthActionStack') && sidebar.includes('mode="activity-modules"'),
  'growth owns economy CTA; activity stack is downstream slice',
);

// --- 7G.3 / 7G.4 Legacy settlement fallback ------------------------------------
console.log('\n7G.3–7G.4 Legacy settlement fallback (central)');
assert(
  isLegacyPricedCheckoutEligible({ priceCents: 1500, listingIntent: 'OFFER' }),
  'legacy priced offer is checkout-eligible',
);
assert(
  !isLegacyPricedCheckoutEligible({ priceCents: 0, listingIntent: 'REQUEST' }),
  'REQUEST rows are not legacy checkout-eligible',
);
{
  const legacyCheckout = resolveSettlementOptions({
    priceCents: 1200,
    orderMethod: 'HOMECHEFF_PAYMENT',
    stripeConnectReady: true,
  });
  assert(legacyCheckout.canCheckoutNow, 'legacy priced + Connect → HomeCheff Checkout available');

  const noConnect = resolveSettlementOptions({
    priceCents: 1200,
    orderMethod: 'HOMECHEFF_PAYMENT',
    stripeConnectReady: false,
  });
  assert(!noConnect.canCheckoutNow, 'no HomeCheff Checkout without Connect');

  const explicitOff = resolveSettlementOptions({
    acceptHomeCheffPayment: false,
    acceptDirectContact: true,
    priceCents: 1200,
    stripeConnectReady: true,
  });
  assert(
    !explicitOff.canCheckoutNow && explicitOff.acceptsDirectContact,
    'explicit booleans win over legacy fallback',
  );

  const tileModel = {
    id: 't1',
    href: '/p/1',
    entityType: 'product',
    title: 'Test',
    mode: 'sale',
    priceCents: 1200,
    orderMethod: 'HOMECHEFF_PAYMENT',
    homeCheffCheckoutConfigured: true,
  } as MarketplaceTileModel;
  const row = buildTileSettlementRow(tileModel);
  assert(row?.homecheffCheckout === true, 'tile settlement row uses central builder for legacy priced item');
}

const settlementRowUi = read('components/marketplace/tiles/primitives/TileSettlementRow.tsx');
assert(settlementRowUi.includes('ShieldCheck'), 'HomeCheff Checkout uses ShieldCheck icon');
assert(!settlementRowUi.includes('Banknote') || settlementRowUi.includes('homecheffCheckout'),
  'settlement row keeps cash icon separate from checkout');

const feed = read('app/api/feed/route.ts');
assert(feed.includes('sellerStripeConnectReady'), 'feed emits connect readiness for legacy rows');
assert(feed.includes("acceptHomeCheffPayment: null"), 'legacy dish/listing rows omit explicit booleans');

// --- 7G.5–7G.7 Filter perceived performance ----------------------------------
console.log('\n7G.5–7G.7 Filter speed — stale results + debounce');
const geo = read('components/feed/GeoFeed.tsx');
assert(geo.includes('feedRefreshing'), 'GeoFeed tracks warm refresh separately from initial load');
assert(geo.includes('showFeedSkeleton'), 'skeleton only on cold initial load');
assert(geo.includes('showStaleFeedWhileRefreshing'), 'prior results stay visible during refresh');
assert(geo.includes('useDebouncedValue'), 'search/refine input is debounced');
assert(exists('hooks/useDebouncedValue.ts'), 'debounce hook present');
assert(geo.includes('feed.updating'), 'subtle updating status while refreshing');
assert(!geo.includes('key={JSON.stringify'), 'GeoFeed root is not remounted on filter change');
assert(geo.includes('AbortController'), 'feed fetch remains abortable');

const en = json('public/i18n/en.json');
const nl = json('public/i18n/nl.json');
assert(get(en, 'feed.updating') != null, 'en: feed.updating i18n');
assert(get(nl, 'feed.updating') != null, 'nl: feed.updating i18n');

// --- 7G.8 Mobile tile spacing --------------------------------------------------
console.log('\n7G.8 Mobile tile spacing guard');
for (const f of [
  'components/marketplace/tiles/MarketplaceTileCompact.tsx',
  'components/marketplace/tiles/MarketplaceTileStandard.tsx',
  'components/marketplace/tiles/MarketplaceTileMini.tsx',
]) {
  const src = read(f);
  assert(src.includes('self-start') && src.includes('shrink-0'), `${path.basename(f)} compact layout`);
}
assert(read('app/globals.css').includes('align-self: start'), 'feed grid prevents card stretch');

// --- Deliverables --------------------------------------------------------------
console.log('\nDeliverables');
assert(exists('docs/audits/HOMEPAGE_SIDEBAR_FILTER_PHASE7G_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE7G_SIDEBAR_FILTER.md'), 'progress doc');

// --- Prior validators still referenced -----------------------------------------
console.log('\nPrior phase scripts (presence)');
for (const s of [
  'scripts/validate-discovery-filter-ui-phase7e.ts',
  'scripts/validate-marketplace-architecture-phase7d.ts',
  'scripts/validate-settlement-options-phase7c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(exists(s), s);
}

// --- Live suppression sanity ---------------------------------------------------
console.log('\n7G.2 Suppression logic (live)');
{
  const mockPlan = {
    desktopRightSidebar: [],
    growthSurfaces: {
      desktopStack: [
        {
          slotId: 'opportunity',
          visible: true,
          opportunity: { opportunityType: 'COURIER' },
        },
      ],
    },
    opportunityEconomy: {
      desktopSidebar: { opportunityType: 'COURIER' },
    },
  } as Parameters<typeof resolveSidebarDeliveryCtaSuppression>[0];

  const suppression = resolveSidebarDeliveryCtaSuppression(mockPlan, {
    activityModulesMode: true,
  });
  assert(
    suppression.suppressOpportunityStackEconomy,
    'suppress duplicate economy COURIER when growth already shows it',
  );
  assert(
    suppression.suppressedPromotionIds.includes('werken-bij'),
    'hide werken-bij promo when delivery CTA visible',
  );
  assert(planShowsDeliveryEconomyOpportunity(mockPlan), 'plan detects delivery economy opportunity');
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
