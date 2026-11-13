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
