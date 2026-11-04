import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FEED_MOUNTED_CARD_CAP,
  nextFeedDomStart,
  sliceMountedFeedRows,
} from '@/lib/feed/feed-dom-window';

describe('feed DOM window', () => {
  it('keeps the first page mounted and caps a long feed', () => {
    const rows = Array.from({ length: 200 }, (_, index) => index);
    const first = sliceMountedFeedRows(rows, 0);
    assert.equal(first.rows.length, FEED_MOUNTED_CARD_CAP);
    assert.deepEqual(first.rows.slice(0, 3), [0, 1, 2]);

    const slid = sliceMountedFeedRows(rows, 12);
    assert.equal(slid.rows.length, FEED_MOUNTED_CARD_CAP);
    assert.equal(slid.rows[0], 12);
    assert.equal(new Set(slid.rows).size, slid.rows.length);
  });

  it('does not skip cards until the oldest ones have left the viewport', () => {
    const staying = nextFeedDomStart({
      currentStart: 0,
      rowCount: 200,
      oldestCardsAboveViewport: false,
      releasedRegionVisible: false,
    });
    assert.equal(staying, 0);

    const advanced = nextFeedDomStart({
      currentStart: 0,
      rowCount: 200,
      oldestCardsAboveViewport: true,
      releasedRegionVisible: false,
    });
    assert.equal(advanced, 6);
    assert.equal(sliceMountedFeedRows(Array.from({ length: 200 }, (_, i) => i), advanced).rows.length, 36);
  });

  it('restores earlier cards when the visitor scrolls back', () => {
    const restored = nextFeedDomStart({
      currentStart: 18,
      rowCount: 200,
      oldestCardsAboveViewport: false,
      releasedRegionVisible: true,
    });
    assert.equal(restored, 12);
  });
});
