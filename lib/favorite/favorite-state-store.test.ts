import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getFavoriteSnapshot,
  seedFavoriteSnapshot,
  setFavoriteSnapshot,
} from '@/lib/favorite/favorite-state-store';

describe('favorite-state-store', () => {
  it('keeps one snapshot per product id across seed and local toggle', () => {
    seedFavoriteSnapshot('product', 'p1', { favorited: false });
    assert.equal(getFavoriteSnapshot('product', 'p1')?.favorited, false);
    setFavoriteSnapshot('product', 'p1', { favorited: true }, { local: true });
    assert.equal(getFavoriteSnapshot('product', 'p1')?.favorited, true);
    seedFavoriteSnapshot('product', 'p1', { favorited: false });
    assert.equal(getFavoriteSnapshot('product', 'p1')?.favorited, true);
  });
});
