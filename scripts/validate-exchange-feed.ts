#!/usr/bin/env npx tsx
/**
 * Phase 4G exchange feed + mobile surface validation.
 * Run: npx tsx scripts/validate-exchange-feed.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  EXCHANGE_SUGGESTION_CAPS,
  EXCHANGE_SUGGESTION_I18N_KEYS,
  EXCHANGE_SUGGESTION_SURFACES,
  applyExchangeSuggestionCaps,
} from '../lib/marketplace/exchange-suggestions';
import { interleaveExchangeFeedInserts } from '../lib/feed/exchange-suggestion-feed-rows';
import type { ExchangeSuggestionCard } from '../lib/marketplace/exchange-suggestions';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  const raw = fs.readFileSync(
    path.join(process.cwd(), `public/i18n/${locale}.json`),
    'utf8',
  );
  return JSON.parse(raw) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const sampleCard = (id: string): ExchangeSuggestionCard => ({
  id,
  suggestionType: 'DIRECT_EXCHANGE',
  modifierTypes: [],
  primaryMatchType: 'OFFER_DESIRED',
  score: 72,
  typeLabelKey: 'marketplace.exchangeSuggestions.types.direct',
  summaryLabelKey: 'marketplace.exchangeSuggestions.summaries.direct',
  summaryParams: { title: 'Herbs', distance: '2' },
  sourceListingId: 'src-1',
  targetListingId: `tgt-${id}`,
  counterpartyListingId: `tgt-${id}`,
  counterpartyTitle: 'Fresh herbs',
  counterpartyUsername: 'grower',
  counterpartyUserId: `user-${id}`,
  distanceKm: 2,
  mainCategory: 'HOME_GARDEN',
  allowedCtas: ['view_listing', 'view_profile', 'start_conversation'],
  signalKinds: [],
});

console.log('=== Exchange Feed Validation (Phase 4G) ===\n');

console.log('Surfaces');
assert(
  (EXCHANGE_SUGGESTION_SURFACES as readonly string[]).includes('exchange_feed_insert'),
  'exchange_feed_insert surface',
);
assert(
  (EXCHANGE_SUGGESTION_SURFACES as readonly string[]).includes('mobile'),
  'mobile surface',
);

console.log('\nCaps');
assert(EXCHANGE_SUGGESTION_CAPS.perPageFeedInsert === 1, 'feed insert 1 per viewport');
assert(EXCHANGE_SUGGESTION_CAPS.perSessionFeedInserts === 3, 'feed max 3 per session');
assert(EXCHANGE_SUGGESTION_CAPS.feedInsertListingInterval === 20, 'feed interval 20 listings');
assert(EXCHANGE_SUGGESTION_CAPS.perPageSidebar === 3, 'sidebar desktop max 3');
assert(EXCHANGE_SUGGESTION_CAPS.perPageSidebarMobile === 2, 'sidebar mobile max 2');
assert(EXCHANGE_SUGGESTION_CAPS.perPageMobile === 2, 'mobile max 2');

const feedBatch = applyExchangeSuggestionCaps(
  [sampleCard('a'), sampleCard('b'), sampleCard('c'), sampleCard('d')],
  'exchange_feed_insert',
  {
    sessionImpressionCount: 0,
    feedInsertSessionCount: 0,
    dismissedSuggestionIds: [],
    sellerImpressionsToday: {},
    globalSnoozeUntil: null,
  },
  { feedBatch: true },
);
assert(feedBatch.items.length === 3, 'feed batch returns up to 3');

const feedSessionCapped = applyExchangeSuggestionCaps(
  [sampleCard('a')],
  'exchange_feed_insert',
  {
    sessionImpressionCount: 0,
    feedInsertSessionCount: 3,
    dismissedSuggestionIds: [],
    sellerImpressionsToday: {},
    globalSnoozeUntil: null,
  },
  { feedBatch: true },
);
assert(feedSessionCapped.items.length === 0, 'feed session cap blocks inserts');

const sidebarDesktop = applyExchangeSuggestionCaps(
  Array.from({ length: 5 }, (_, i) => sampleCard(`d-${i}`)),
  'sidebar',
  {
    sessionImpressionCount: 0,
    feedInsertSessionCount: 0,
    dismissedSuggestionIds: [],
    sellerImpressionsToday: {},
    globalSnoozeUntil: null,
  },
  { sidebarVariant: 'desktop' },
);
assert(sidebarDesktop.items.length === 3, 'sidebar desktop cap 3');

const sidebarMobile = applyExchangeSuggestionCaps(
  Array.from({ length: 5 }, (_, i) => sampleCard(`m-${i}`)),
  'sidebar',
  {
    sessionImpressionCount: 0,
    feedInsertSessionCount: 0,
    dismissedSuggestionIds: [],
    sellerImpressionsToday: {},
    globalSnoozeUntil: null,
  },
  { sidebarVariant: 'mobile' },
);
assert(sidebarMobile.items.length === 2, 'sidebar mobile cap 2');

console.log('\nFeed interleaving');
const saleRows = Array.from({ length: 60 }, (_, i) => ({
  row: 'sale' as const,
  item: { id: `sale-${i}` },
}));
const interleaved = interleaveExchangeFeedInserts(
  saleRows,
  [sampleCard('1'), sampleCard('2'), sampleCard('3')],
  3,
);
const insertRows = interleaved.filter((r) => r.row === 'exchange_feed_insert');
assert(insertRows.length === 3, 'three feed inserts in 60 sales');
const positions = insertRows.map((r) =>
  r.row === 'exchange_feed_insert' ? r.position : -1,
);
assert(positions.every((p, i) => p === i), 'sequential insert positions');

const duplicateCards = [sampleCard('dup'), sampleCard('dup'), sampleCard('x')];
const deduped = interleaveExchangeFeedInserts(saleRows.slice(0, 25), duplicateCards, 3);
const dedupedIds = deduped
  .filter((r) => r.row === 'exchange_feed_insert')
  .map((r) => (r.row === 'exchange_feed_insert' ? r.card.id : ''));
assert(new Set(dedupedIds).size === dedupedIds.length, 'no duplicate insert cards');

console.log('\nAnalytics events');
const analyticsSrc = fs.readFileSync(
  path.join(process.cwd(), 'lib/marketplace/exchange-suggestions/exchange-suggestion-analytics.ts'),
  'utf8',
);
for (const event of [
  'exchange_suggestion_impression',
  'exchange_suggestion_open',
  'exchange_suggestion_cta_click',
]) {
  assert(analyticsSrc.includes(event), `analytics event ${event}`);
}

console.log('\ni18n (en + nl)');
for (const locale of ['en', 'nl'] as const) {
  const i18n = loadI18n(locale);
  for (const key of EXCHANGE_SUGGESTION_I18N_KEYS) {
    assert(getNested(i18n, key) !== undefined, `${locale}: ${key}`);
  }
}

console.log('\nComponents');
for (const file of [
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsFeedInsert.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsMobileModule.tsx',
  'lib/feed/exchange-suggestion-feed-rows.ts',
  'lib/marketplace/exchange-suggestions/exchange-suggestion-analytics.ts',
  'lib/marketplace/exchange-suggestions/exchange-suggestion-category-icon.ts',
  'docs/progress/MARKETPLACE_EXCHANGE_PHASE4G.md',
  'docs/audits/EXCHANGE_SUGGESTIONS_FEED_AUDIT.md',
]) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

const feedInsertSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/marketplace/exchange-suggestions/ExchangeSuggestionsFeedInsert.tsx'),
  'utf8',
);
assert(!feedInsertSrc.includes('skeleton'), 'no feed skeleton');
assert(!feedInsertSrc.includes('placeholder'), 'no feed placeholder');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
