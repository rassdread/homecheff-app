import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspirationEligibleForFeedScope } from './feed-composition-policy';
import {
  INSPIRATION_FEED_PAGE_TAKE,
  decodeInspirationCursor,
  inspirationCursorAdvanced,
  scanInspirationSourcePage,
} from './inspiration-feed-page';

type Row = {
  id: string;
  createdAt: string;
  lat: number | null;
  lng: number | null;
  place: string | null;
};

function row(index: number, eligible: boolean): Row {
  const created = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
  return {
    id: `dish-${String(index).padStart(4, '0')}`,
    createdAt: created,
    lat: eligible ? 52.09 : 18.02,
    lng: eligible ? 5.12 : -63.05,
    place: eligible ? 'Utrecht' : 'Sint Maarten',
  };
}

function nationalEligible(item: Row): boolean {
  return inspirationEligibleForFeedScope({
    scope: 'national',
    item: { lat: item.lat, lng: item.lng, place: item.place },
  });
}

describe('inspiration source pages', () => {
  it('keeps a cursor past a full page and does not treat page length as the end', () => {
    const rows = Array.from({ length: INSPIRATION_FEED_PAGE_TAKE + 1 }, (_, index) =>
      row(INSPIRATION_FEED_PAGE_TAKE - index, false),
    );
    const page = scanInspirationSourcePage({
      rows,
      take: INSPIRATION_FEED_PAGE_TAKE,
      eligible: nationalEligible,
    });
    assert.equal(page.items.length, 0);
    assert.equal(page.hasMore, true);
    assert.equal(page.scanned, INSPIRATION_FEED_PAGE_TAKE);
    assert.ok(page.nextCursor);
    assert.equal(inspirationCursorAdvanced(null, page.nextCursor, page.hasMore), true);
    assert.equal(
      inspirationCursorAdvanced(page.nextCursor, page.nextCursor, true),
      false,
    );
  });

  it('finds a suitable dish after more than 192 newer unsuitable dishes', () => {
    const total = 200;
    const newestFirst = Array.from({ length: total }, (_, newestIndex) => {
      const age = total - 1 - newestIndex;
      return row(age, age === 0);
    });
    const found: Row[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    let requests = 0;
    while (requests < 12) {
      requests += 1;
      const start = cursor
        ? newestFirst.findIndex(
            (item) =>
              `${item.createdAt}|${item.id}` === cursor,
          ) + 1
        : 0;
      const slice = newestFirst.slice(start, start + INSPIRATION_FEED_PAGE_TAKE + 1);
      const page = scanInspirationSourcePage({
        rows: slice,
        take: INSPIRATION_FEED_PAGE_TAKE,
        eligible: nationalEligible,
      });
      assert.ok(page.scanned <= INSPIRATION_FEED_PAGE_TAKE);
      for (const item of page.items) {
        assert.equal(seen.has(item.id), false);
        seen.add(item.id);
        found.push(item);
      }
      if (!page.hasMore) break;
      assert.equal(inspirationCursorAdvanced(cursor, page.nextCursor, true), true);
      cursor = page.nextCursor;
    }
    assert.equal(found.length, 1);
    assert.equal(found[0]?.place, 'Utrecht');
    assert.ok(requests > 4);
    assert.ok(requests < 12);
  });

  it('stops on a short source page and still applies nearby and national rules', () => {
    const rows = [row(3, true), row(2, false), row(1, true)].slice().reverse();
    const page = scanInspirationSourcePage({
      rows,
      take: INSPIRATION_FEED_PAGE_TAKE,
      eligible: (item) =>
        inspirationEligibleForFeedScope({
          scope: 'nearby',
          item,
          viewer: { lat: 52.09, lng: 5.12 },
          radiusKm: 25,
        }),
    });
    assert.equal(page.hasMore, false);
    assert.equal(page.nextCursor, null);
    assert.deepEqual(
      page.items.map((item) => item.place),
      ['Utrecht', 'Utrecht'],
    );
    assert.equal(decodeInspirationCursor('not-a-cursor'), null);
  });
});
