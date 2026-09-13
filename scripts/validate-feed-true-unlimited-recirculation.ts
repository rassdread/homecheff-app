#!/usr/bin/env npx tsx
/**
 * True unlimited scroll = unique pagination THEN intentional recirculation cycles.
 * Proves UNIQUE_INVENTORY_EXHAUSTED ≠ FEED_EXHAUSTED for HomeCheff composition.
 */
import assert from 'node:assert/strict';

import {
  FEED_RECIRC_BATCH_SIZE,
  FEED_RECIRC_MIN_SPACING,
  buildRecirculationBatch,
  type RecircSeedItem,
} from '../lib/feed/feed-composition-policy';
import {
  composedFeedCanContinue,
  createFeedCompositionState,
  markBroadenedPageResult,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  resetFeedCompositionState,
  shouldActivateRecirculation,
  shouldFetchBroadenedDiscovery,
  bumpRecirculatedCount,
} from '../lib/feed/feed-composition-state';
import { buildFeedPaginationMeta } from '../lib/feed/feed-pagination';

console.log('=== True unlimited recirculation ===\n');

/** Simulate national inventory of 34 (production-like). */
const INVENTORY = Array.from({ length: 34 }, (_, i) => ({
  id: `item-${i}`,
  kind: (i % 5 === 0 ? 'insp' : 'sale') as RecircSeedItem['kind'],
}));

type Occurrence = {
  position: number;
  contentId: string;
  cycle: number;
  source: 'exact' | 'recirculated';
};

const occurrences: Occurrence[] = [];
let cycle = 1;

// --- Cycle 1: unique pagination via nextSkip ---
let skip = 0;
const seenUnique = new Set<string>();
while (true) {
  const total = INVENTORY.length;
  const page = INVENTORY.slice(skip, skip + 10);
  const meta = buildFeedPaginationMeta(10, skip, total, {
    pageCount: page.length,
  });
  for (const row of page) {
    assert.equal(seenUnique.has(row.id), false, `accidental dup ${row.id}`);
    seenUnique.add(row.id);
    occurrences.push({
      position: occurrences.length + 1,
      contentId: row.id,
      cycle: 1,
      source: 'exact',
    });
  }
  if (!meta.hasMore) break;
  skip = meta.nextSkip;
}
assert.equal(seenUnique.size, 34, 'cycle 1 reaches full unique inventory');
assert.equal(occurrences.length, 34);

// --- Composition handoff: exact exhaust on already-wide (national) scope ---
let state = createFeedCompositionState('national|all');
state = recordDisplayedSeeds(state, INVENTORY);
state = markMarketplacePageResult(state, {
  fetchedCount: 4,
  apiHasMore: false,
  skipUsed: 30,
  advanceBy: 4,
});
assert.equal(state.exactExhausted, true);
assert.equal(shouldFetchBroadenedDiscovery(state), true);
// Product rule: when scope cannot widen, client seals broadened immediately.
state = markBroadenedPageResult(state, {
  fetchedCount: 0,
  newUniqueCount: 0,
  apiHasMore: false,
  skipUsed: 0,
});
assert.equal(state.broadenedExhausted, true);
assert.equal(state.stage, 'recirculation');
assert.equal(shouldActivateRecirculation(state), true);
assert.equal(composedFeedCanContinue(state), true, 'feed must NOT stop after unique exhaust');

// --- Cycles 2+: recirculation batches (intentional repeats) ---
cycle = 2;
let lastId: string | null = occurrences[occurrences.length - 1]?.contentId ?? null;
let recentIds = occurrences.map((o) => o.contentId);
let intentionalRecirc = 0;
let accidentalDupsInBatch = 0;

while (occurrences.length < 100) {
  const batch = buildRecirculationBatch({
    seeds: INVENTORY,
    recentIds,
    lastDisplayedId: lastId,
    take: FEED_RECIRC_BATCH_SIZE,
    batchIndex: state.recirculationBatchIndex,
  });
  assert.ok(batch.length > 0, 'recirculation must yield batches with seeds');

  const batchIds = batch.map((b) => b.id);
  // Accidental: consecutive identical within same batch when alternatives exist
  for (let i = 1; i < batchIds.length; i++) {
    if (batchIds[i] === batchIds[i - 1] && INVENTORY.length > 1) {
      accidentalDupsInBatch += 1;
    }
  }

  for (const seed of batch) {
    intentionalRecirc += 1;
    occurrences.push({
      position: occurrences.length + 1,
      contentId: seed.id,
      cycle,
      source: 'recirculated',
    });
    recentIds = [...recentIds, seed.id].slice(-FEED_RECIRC_MIN_SPACING * 4);
    lastId = seed.id;
  }

  state = bumpRecirculatedCount(
    recordDisplayedSeeds(state, batch),
    batch.length,
  );
  assert.equal(composedFeedCanContinue(state), true);

  // Advance cycle marker every full inventory worth of recirculated occurrences
  const recircCount = occurrences.filter((o) => o.source === 'recirculated').length;
  cycle = 1 + Math.ceil(recircCount / INVENTORY.length);
}

assert.ok(occurrences.length >= 80, `need >=80 occurrences, got ${occurrences.length}`);
assert.equal(accidentalDupsInBatch, 0, 'no consecutive accidental dups in batches');
assert.ok(intentionalRecirc > 0, 'intentional recirculation required');

const cycle1End = occurrences.filter((o) => o.cycle === 1).length;
const cycle2Start = occurrences.findIndex((o) => o.cycle === 2) + 1;
const cycle2Count = occurrences.filter((o) => o.cycle === 2).length;
const cycle3Started = occurrences.some((o) => o.cycle >= 3);

assert.equal(cycle1End, 34);
assert.equal(cycle2Start, 35);
assert.ok(cycle2Count > 0);
assert.equal(cycle3Started, true);

// Spacing: first recirculated id should not equal last unique id when inventory large
const firstRecirc = occurrences.find((o) => o.source === 'recirculated');
assert.ok(firstRecirc);
assert.notEqual(
  firstRecirc!.contentId,
  occurrences[33].contentId,
  'recirc should avoid consecutive same id when alternatives exist',
);

// Filter reset clears cycle
const reset = resetFeedCompositionState(state, 'national|chef');
assert.equal(reset.marketplaceSkip, 0);
assert.equal(reset.recirculationActive, false);
assert.equal(reset.recirculationBatchIndex, 0);

// Zero inventory → no recirculation
let empty = createFeedCompositionState('empty');
empty = markMarketplacePageResult(empty, {
  fetchedCount: 0,
  apiHasMore: false,
  skipUsed: 0,
});
assert.equal(empty.emptyTerminal, true);
assert.equal(composedFeedCanContinue(empty), false);

// One item → spaced recirculation, not request storm
const oneSeeds: RecircSeedItem[] = [{ id: 'only', kind: 'sale' }];
const oneA = buildRecirculationBatch({
  seeds: oneSeeds,
  recentIds: ['only'],
  lastDisplayedId: 'only',
  take: FEED_RECIRC_BATCH_SIZE,
  batchIndex: 0,
});
assert.equal(oneA.length, 1, 'single-seed mode: 1 card per batch');

console.log(
  JSON.stringify(
    {
      TOTAL_OCCURRENCES: occurrences.length,
      UNIQUE_CONTENT_IDS: seenUnique.size,
      CYCLE_1_COUNT: cycle1End,
      CYCLE_2_COUNT: cycle2Count,
      CYCLE_2_STARTS: cycle2Start,
      CYCLE_3_STARTED: cycle3Started,
      INTENTIONAL_RECIRCULATIONS: intentionalRecirc,
      ACCIDENTAL_DUPLICATES: accidentalDupsInBatch,
    },
    null,
    2,
  ),
);
console.log('\nOK — true unlimited recirculation contract holds\n');
