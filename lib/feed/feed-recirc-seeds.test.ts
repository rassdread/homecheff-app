import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRecirculationBatch,
  mergeRecircSeeds,
} from './feed-composition-policy';

describe('recirculation seeds', () => {
  it('keeps a short history from collapsing the visible cards', () => {
    const merged = mergeRecircSeeds(
      [
        { id: 'a', kind: 'sale' },
        { id: 'b', kind: 'sale' },
      ],
      [
        { id: 'a', kind: 'sale' },
        { id: 'b', kind: 'sale' },
        { id: 'c', kind: 'insp' },
        { id: 'd', kind: 'sale' },
      ],
    );
    assert.deepEqual(
      merged.map((seed) => seed.id),
      ['a', 'b', 'c', 'd'],
    );
  });

  it('does not repeat an id inside one batch when more than the spacing minimum is visible', () => {
    const seeds = Array.from({ length: 10 }, (_, index) => ({
      id: `item-${index}`,
      kind: 'sale' as const,
    }));
    const batch = buildRecirculationBatch({
      seeds,
      recentIds: seeds.slice(-6).map((seed) => seed.id),
      lastDisplayedId: 'item-9',
      take: 8,
      batchIndex: 0,
    });
    assert.ok(batch.length > 0);
    assert.equal(new Set(batch.map((seed) => seed.id)).size, batch.length);
    assert.equal(
      batch.some((seed) =>
        ['item-4', 'item-5', 'item-6', 'item-7', 'item-8', 'item-9'].includes(
          seed.id,
        ),
      ),
      false,
    );
  });
});

describe('small recirculation inventories', () => {
  const seedsOf = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `item-${index}`,
      kind: 'sale' as const,
    }));

  function ticks(count: number, times: number) {
    const seeds = seedsOf(count);
    const shown: string[] = [];
    let last: string | null = null;
    for (let batchIndex = 0; batchIndex < times; batchIndex += 1) {
      const batch = buildRecirculationBatch({
        seeds,
        recentIds: shown,
        lastDisplayedId: last,
        take: 8,
        batchIndex,
      });
      if (batch.length === 0) break;
      for (const seed of batch) {
        shown.push(seed.id);
        last = seed.id;
      }
    }
    return shown;
  }

  it('does not request a batch from an empty set', () => {
    assert.deepEqual(ticks(0, 4), []);
  });

  it('keeps loading one card for a single item', () => {
    const shown = ticks(1, 4);
    assert.deepEqual(shown, ['item-0', 'item-0', 'item-0', 'item-0']);
  });

  it('alternates two items and never places them back to back', () => {
    const shown = ticks(2, 6);
    assert.deepEqual(shown, [
      'item-0',
      'item-1',
      'item-0',
      'item-1',
      'item-0',
      'item-1',
    ]);
    for (let index = 1; index < shown.length; index += 1) {
      assert.notEqual(shown[index], shown[index - 1]);
    }
  });

  for (const count of [3, 4, 5, 6]) {
    it(`rotates all ${count} items without a consecutive repeat`, () => {
      const shown = ticks(count, 3);
      assert.ok(shown.length >= count);
      const firstRound = shown.slice(0, count);
      assert.equal(new Set(firstRound).size, count);
      for (let index = 1; index < shown.length; index += 1) {
        assert.notEqual(shown[index], shown[index - 1]);
      }
    });
  }

  it('keeps a six-position gap when seven items make that gap possible', () => {
    const seeds = seedsOf(7);
    const recent = seeds.slice(1).map((seed) => seed.id);
    const batch = buildRecirculationBatch({
      seeds,
      recentIds: recent,
      lastDisplayedId: 'item-6',
      take: 8,
      batchIndex: 0,
    });
    assert.deepEqual(
      batch.map((seed) => seed.id),
      ['item-0'],
    );
  });
});
