#!/usr/bin/env npx tsx
/**
 * Phase 4F exchange suggestions validation.
 * Run: npx tsx scripts/validate-exchange-suggestions.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildExchangeListingProfile,
  scorePayloadIsClean,
} from '../lib/marketplace/exchange';
import { buildDesiredExchangeDetail } from '../lib/marketplace/value-exchange';
import {
  ACTIVE_EXCHANGE_SUGGESTION_TYPES,
  EXCHANGE_SUGGESTION_CAPS,
  EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS,
  EXCHANGE_SUGGESTION_I18N_KEYS,
  EXCHANGE_SUGGESTION_SURFACES,
  FORBIDDEN_EXCHANGE_SUGGESTION_SURFACES,
  FUTURE_EXCHANGE_SUGGESTION_TYPES,
  applyExchangeSuggestionCaps,
  isAllowedExchangeSuggestionSurface,
  isForbiddenExchangeSuggestionSurface,
  previewExchangeSuggestionPair,
  resolveExchangeSuggestions,
  suggestionPayloadIsClean,
  surfaceNeverRendersOnTiles,
} from '../lib/marketplace/exchange-suggestions';
import { DETAIL_EXCHANGE_SUGGESTIONS_SLOT } from '../lib/marketplace/detail';

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

const now = Date.now();

const herbOffer = buildExchangeListingProfile({
  listingId: 'listing-herbs-1',
  userId: 'user-c',
  listingKind: 'PRODUCT',
  listingIntent: 'OFFER',
  marketplaceCategory: 'GROW',
  specializationIds: ['grow.basil', 'grow.oregano'],
  acceptedTaxonomyIds: ['practical.repair'],
  barterOpenness: 'MONEY_AND_BARTER',
  priceModel: 'FIXED',
  createdAt: new Date(now - 3 * 86_400_000).toISOString(),
  distanceKm: 2,
});

const gardenRequest = buildExchangeListingProfile({
  listingId: 'listing-garden-req-1',
  userId: 'user-b',
  listingIntent: 'REQUEST',
  listingKind: 'REQUEST',
  marketplaceCategory: 'GROW',
  specializationIds: [],
  acceptedTaxonomyIds: [],
  barterOpenness: 'MONEY',
  priceModel: 'ON_REQUEST',
  desiredExchanges: [
    buildDesiredExchangeDetail({
      mainCategory: 'HOME_GARDEN',
      subcategoryId: 'grow.basil',
      description: 'Basil',
    })!,
    buildDesiredExchangeDetail({
      mainCategory: 'HOME_GARDEN',
      subcategoryId: 'grow.oregano',
      description: 'Oregano',
    })!,
  ],
  createdAt: new Date(now - 1 * 86_400_000).toISOString(),
  distanceKm: 4,
});

const meta = {
  [herbOffer.listingId]: {
    title: 'Fresh herbs',
    username: 'herb-grower',
    userId: herbOffer.userId,
  },
  [gardenRequest.listingId]: {
    title: 'Garden help wanted',
    username: 'gardener',
    userId: gardenRequest.userId,
  },
};

console.log('=== Exchange Suggestions Validation (Phase 4F) ===\n');

console.log('Suggestion types');
assert(ACTIVE_EXCHANGE_SUGGESTION_TYPES.length === 5, 'five active types');
assert(
  !(ACTIVE_EXCHANGE_SUGGESTION_TYPES as readonly string[]).includes(
    'MULTI_STEP_EXCHANGE',
  ),
  'multi-step not active',
);
assert(FUTURE_EXCHANGE_SUGGESTION_TYPES[0] === 'MULTI_STEP_EXCHANGE', 'multi-step future-only');

console.log('\nSurface rules');
for (const surface of EXCHANGE_SUGGESTION_SURFACES) {
  assert(isAllowedExchangeSuggestionSurface(surface), `allowed ${surface}`);
}
for (const forbidden of FORBIDDEN_EXCHANGE_SUGGESTION_SURFACES) {
  assert(isForbiddenExchangeSuggestionSurface(forbidden), `forbidden ${forbidden}`);
  assert(surfaceNeverRendersOnTiles(forbidden), `no tiles ${forbidden}`);
}
assert(DETAIL_EXCHANGE_SUGGESTIONS_SLOT === 'exchange_suggestions', 'detail slot id');

console.log('\nResolver (4D matching only)');
const detailPlan = resolveExchangeSuggestions({
  surface: 'detail',
  viewerUserId: 'user-a',
  viewerListingIds: [],
  sourceListing: gardenRequest,
  candidates: [gardenRequest, herbOffer],
  candidateMeta: meta,
});
assert(detailPlan.showModule, 'detail plan has suggestions');
assert(detailPlan.suggestions.length <= EXCHANGE_SUGGESTION_CAPS.perPageDetail, 'detail max 3');
assert(
  detailPlan.suggestions.every((s) =>
    (ACTIVE_EXCHANGE_SUGGESTION_TYPES as readonly string[]).includes(s.suggestionType),
  ),
  'detail types active only',
);
assert(
  !detailPlan.suggestions.some((s) => s.suggestionType === 'MULTI_STEP_EXCHANGE'),
  'no multi-step suggestions',
);

const profilePlan = resolveExchangeSuggestions({
  surface: 'profile_owner',
  viewerUserId: 'user-c',
  viewerListingIds: [herbOffer.listingId],
  candidates: [gardenRequest, herbOffer],
  candidateMeta: meta,
});
assert(
  profilePlan.outbound.length + profilePlan.inbound.length <=
    EXCHANGE_SUGGESTION_CAPS.perPageProfile * 2,
  'profile tab caps',
);

const pair = previewExchangeSuggestionPair(gardenRequest, herbOffer);
assert(pair !== null && pair.match.score > 0, '4D pair resolves');
assert(scorePayloadIsClean(pair!.scoreSignals as unknown as Record<string, unknown>), 'score clean');

console.log('\nForbidden signals');
const dirty = { viewCount: 10, hcpPoints: 5 };
assert(!suggestionPayloadIsClean(dirty), 'dirty payload detected');
for (const signal of EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS) {
  assert(
    (EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS as readonly string[]).includes(signal),
    `forbidden ${signal}`,
  );
}
const cardJson = JSON.stringify(detailPlan.suggestions[0] ?? {});
for (const signal of ['viewCount', 'hcpPoints', 'followerCount', 'blendedRating']) {
  assert(!cardJson.includes(`"${signal}"`), `card excludes ${signal}`);
}

console.log('\nCaps');
const manyCards = Array.from({ length: 10 }, (_, i) => ({
  ...detailPlan.suggestions[0]!,
  id: `test-${i}`,
  counterpartyUserId: `seller-${i % 3}`,
}));
const capped = applyExchangeSuggestionCaps(manyCards, 'detail', {
  sessionImpressionCount: 0,
  feedInsertSessionCount: 0,
  dismissedSuggestionIds: [],
  sellerImpressionsToday: {},
  globalSnoozeUntil: null,
});
assert(capped.items.length <= EXCHANGE_SUGGESTION_CAPS.perPageDetail, 'page cap');
const sessionCapped = applyExchangeSuggestionCaps(manyCards, 'detail', {
  sessionImpressionCount: EXCHANGE_SUGGESTION_CAPS.perSessionImpressions,
  feedInsertSessionCount: 0,
  dismissedSuggestionIds: [],
  sellerImpressionsToday: {},
  globalSnoozeUntil: null,
});
assert(sessionCapped.items.length === 0, 'session cap');

console.log('\nCTAs — no auto proposal');
for (const card of detailPlan.suggestions) {
  assert(!card.allowedCtas.includes('request_proposal' as never), 'no proposal CTA');
  assert(card.allowedCtas.includes('view_listing'), 'view listing CTA');
}

console.log('\ni18n (en + nl)');
for (const locale of ['en', 'nl'] as const) {
  const i18n = loadI18n(locale);
  for (const key of EXCHANGE_SUGGESTION_I18N_KEYS) {
    assert(getNested(i18n, key) !== undefined, `${locale}: ${key}`);
  }
}

console.log('\nDocs');
for (const doc of [
  'docs/progress/MARKETPLACE_EXCHANGE_PHASE4F.md',
  'docs/audits/EXCHANGE_SUGGESTIONS_IMPLEMENTATION_AUDIT.md',
]) {
  assert(fs.existsSync(path.join(process.cwd(), doc)), doc);
}

console.log('\nLib + UI files');
const files = [
  'lib/marketplace/exchange-suggestions/exchange-suggestion-contract.ts',
  'lib/marketplace/exchange-suggestions/resolve-exchange-suggestions.ts',
  'lib/marketplace/exchange-suggestions/exchange-suggestion-caps.ts',
  'lib/marketplace/exchange-suggestions/exchange-suggestion-copy.ts',
  'lib/marketplace/exchange-suggestions/exchange-suggestion-surface.ts',
  'lib/marketplace/exchange-suggestions/index.ts',
  'app/api/marketplace/exchange-suggestions/route.ts',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsDetailBlock.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsProfileModule.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsSidebarModule.tsx',
];
for (const file of files) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

const componentSources = [
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsDetailBlock.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsProfileModule.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsSidebarModule.tsx',
  'components/marketplace/exchange-suggestions/ExchangeSuggestionCard.tsx',
].map((f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8'));
for (const src of componentSources) {
  assert(!src.includes('MarketplaceTile'), 'no tile component usage');
  assert(!src.includes('request_proposal'), 'no auto proposal in UI');
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
