#!/usr/bin/env npx tsx
/**
 * Regression: recirculation must produce 100 non-empty batches for 1 / 2 / 3+
 * seed inventories without entering a terminal state while seeds remain.
 */
import assert from 'node:assert/strict';

import {
  FEED_RECIRC_BATCH_SIZE,
  FEED_RECIRC_MIN_SPACING,
  buildRecirculationBatch,
  type RecircSeedItem,
} from '../lib/feed/feed-composition-policy';
import {
  bumpRecirculatedCount,
  composedFeedCanContinue,
  createFeedCompositionState,
  recordDisplayedSeeds,
  shouldActivateRecirculation,
} from '../lib/feed/feed-composition-state';

function seedsOf(n: number): RecircSeedItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `seed-${i}`,
    kind: (i % 3 === 0 ? 'insp' : 'sale') as RecircSeedItem['kind'],
  }));
}

function run100Batches(label: string, inventory: RecircSeedItem[]) {
  let state = createFeedCompositionState(`test|${label}`);
  state = {
    ...recordDisplayedSeeds(state, inventory),
    marketplaceExhausted: true,
    exactExhausted: true,
    broadenedExhausted: true,
    recirculationActive: true,
    stage: 'recirculation',
    uniqueEligibleCount: inventory.length,
  };

  assert.equal(shouldActivateRecirculation(state), true, `${label}: activate`);
  assert.equal(composedFeedCanContinue(state), true, `${label}: can continue`);

  let lastId: string | null = inventory[inventory.length - 1]?.id ?? null;
  let consecutiveSameWhenAlt = 0;
  const batchSizes: number[] = [];
  let prevBatchIndex = state.recirculationBatchIndex;

  for (let i = 0; i < 100; i++) {
    const batch = buildRecirculationBatch({
      seeds: inventory,
      recentIds: state.recentIds,
      lastDisplayedId: lastId,
      take: FEED_RECIRC_BATCH_SIZE,
      minSpacing: FEED_RECIRC_MIN_SPACING,
      batchIndex: state.recirculationBatchIndex,
    });
    assert.ok(
      batch.length > 0,
      `${label}: NO_EMPTY_BATCH_WHILE_SEED_EXISTS failed at batch ${i}`,
    );
    batchSizes.push(batch.length);

    for (let j = 0; j < batch.length; j++) {
      const id = batch[j]!.id;
      if (lastId && id === lastId && inventory.length > 1) {
        consecutiveSameWhenAlt += 1;
      }
      lastId = id;
    }

    state = bumpRecirculatedCount(recordDisplayedSeeds(state, batch), batch.length);
    assert.equal(
      state.recirculationBatchIndex,
      prevBatchIndex + 1,
      `${label}: BATCH_INDEX_MONOTONIC at ${i}`,
    );
    prevBatchIndex = state.recirculationBatchIndex;
    assert.equal(
      composedFeedCanContinue(state),
      true,
      `${label}: NO_TERMINAL_STATE at batch ${i}`,
    );
    assert.equal(state.emptyTerminal, false, `${label}: emptyTerminal at ${i}`);
  }

  assert.equal(
    consecutiveSameWhenAlt,
    0,
    `${label}: NO_CONSECUTIVE_SAME_ID_WHEN_ALTERNATIVE_EXISTS (got ${consecutiveSameWhenAlt})`,
  );

  return {
    label,
    inventory: inventory.length,
    batches: 100,
    totalCards: batchSizes.reduce((a, b) => a + b, 0),
    finalBatchIndex: state.recirculationBatchIndex,
    canContinue: composedFeedCanContinue(state),
  };
}

console.log('=== Recirculation 100-batch regression ===\n');

const one = run100Batches('ONE_SEED', seedsOf(1));
assert.equal(one.totalCards, 100, 'ONE_SEED_CONTINUES: 1 card × 100 batches');

const two = run100Batches('TWO_SEED', seedsOf(2));
assert.ok(two.totalCards >= 100, 'TWO_SEED_ALTERNATES');

const three = run100Batches('THREE_PLUS', seedsOf(3));
const sixteen = run100Batches('INVENTORY_16', seedsOf(16));
const thirtyFour = run100Batches('INVENTORY_34', seedsOf(34));

const report = {
  RECIRC_GENERATOR_CAN_RUN_100_BATCHES: 'YES' as const,
  ONE_ITEM_100_BATCHES: 'YES' as const,
  TWO_ITEM_100_BATCHES: 'YES' as const,
  THREE_PLUS_100_BATCHES: 'YES' as const,
  NO_EMPTY_BATCH_WHILE_SEED_EXISTS: true,
  BATCH_INDEX_MONOTONIC: true,
  NO_TERMINAL_STATE: true,
  NO_CONSECUTIVE_SAME_ID_WHEN_ALTERNATIVE_EXISTS: true,
  FEED_RECIRC_MIN_SPACING,
  results: [one, two, three, sixteen, thirtyFour],
};

console.log(JSON.stringify(report, null, 2));
console.log('\nPASS validate-feed-recirculation-100-batches');
