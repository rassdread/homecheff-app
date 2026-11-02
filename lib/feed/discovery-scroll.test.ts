#!/usr/bin/env npx tsx
/**
 * Marketplace infinite scroll: further results append until the inventory
 * is exhausted, without duplicates, and pagination resets when filters change.
 * Run: npx tsx --test lib/feed/discovery-scroll.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendUniqueById,
  discoveryPaginationResetKey,
  revealNextDiscoveryBatch,
  resolveDiscoveryScrollAction,
} from './discovery-scroll';

const BATCH = 12;

function pageOf(start: number, count: number): Array<{ id: string }> {
  return Array.from({ length: count }, (_, index) => ({
    id: `listing-${start + index}`,
  }));
}

describe('discovery scroll actions', () => {
  it('reveals the next local batch before asking the API', () => {
    assert.equal(
      resolveDiscoveryScrollAction({
        shown: 12,
        available: 28,
        apiHasMore: true,
        loading: false,
        failed: false,
      }),
      'reveal',
    );
  });

  it('fetches the next page only after the loaded window is visible', () => {
    assert.equal(
      resolveDiscoveryScrollAction({
        shown: 24,
        available: 24,
        apiHasMore: true,
        loading: false,
        failed: false,
      }),
      'fetch',
    );
  });

  it('stops when every available listing is shown and the API is finished', () => {
    assert.equal(
      resolveDiscoveryScrollAction({
        shown: 40,
        available: 40,
        apiHasMore: false,
        loading: false,
        failed: false,
      }),
      'idle',
    );
  });

  it('does not auto-retry a network failure, but a user retry fetches again', () => {
    const failed = {
      shown: 12,
      available: 12,
      apiHasMore: true,
      loading: false,
      failed: true,
    };
    assert.equal(resolveDiscoveryScrollAction(failed), 'idle');
    assert.equal(
      resolveDiscoveryScrollAction({ ...failed, userRetry: true }),
      'fetch',
    );
  });

  it('waits while a page is already in flight', () => {
    assert.equal(
      resolveDiscoveryScrollAction({
        shown: 12,
        available: 12,
        apiHasMore: true,
        loading: true,
        failed: false,
      }),
      'idle',
    );
  });
});

describe('multi-page inventory', () => {
  it('appends every unique listing across pages and stops at the real end', () => {
    const pages = [pageOf(1, 12), pageOf(13, 12), pageOf(25, 12), pageOf(37, 4)];
    let loaded: Array<{ id: string }> = [];
    let shown = 0;
    let pageIndex = 0;
    let steps = 0;

    while (steps < 20) {
      steps += 1;
      const apiHasMore = pageIndex < pages.length;
      const action = resolveDiscoveryScrollAction({
        shown,
        available: loaded.length,
        apiHasMore,
        loading: false,
        failed: false,
      });
      if (action === 'idle') break;
      if (action === 'fetch') {
        const page = pages[pageIndex] ?? [];
        pageIndex += 1;
        const duplicate = pageIndex === 2 ? [loaded[0]!] : [];
        loaded = appendUniqueById(loaded, [...duplicate, ...page]);
        continue;
      }
      shown = revealNextDiscoveryBatch({
        shown,
        available: loaded.length,
        batchSize: BATCH,
      });
    }

    assert.equal(loaded.length, 40);
    assert.equal(shown, 40);
    assert.equal(new Set(loaded.map((row) => row.id)).size, 40);
    assert.equal(pageIndex, pages.length);
    assert.equal(
      resolveDiscoveryScrollAction({
        shown,
        available: loaded.length,
        apiHasMore: false,
        loading: false,
        failed: false,
      }),
      'idle',
    );
  });

  it('keeps a short inventory on one page without inventing a next page', () => {
    const loaded = appendUniqueById([], pageOf(1, 3));
    const shown = revealNextDiscoveryBatch({
      shown: 0,
      available: loaded.length,
      batchSize: BATCH,
    });
    assert.equal(shown, 3);
    assert.equal(
      resolveDiscoveryScrollAction({
        shown,
        available: loaded.length,
        apiHasMore: false,
        loading: false,
        failed: false,
      }),
      'idle',
    );
  });
});

describe('filter reset', () => {
  it('changes the pagination key when radius, category, or search changes', () => {
    const base = {
      category: 'all',
      chip: 'sale',
      scope: 'nearby',
      radius: 25,
      query: '',
      place: 'Rotterdam',
    };
    const start = discoveryPaginationResetKey(base);
    assert.equal(discoveryPaginationResetKey(base), start);
    assert.notEqual(discoveryPaginationResetKey({ ...base, radius: 0 }), start);
    assert.notEqual(
      discoveryPaginationResetKey({ ...base, category: 'chef' }),
      start,
    );
    assert.notEqual(
      discoveryPaginationResetKey({ ...base, query: 'olijfolie' }),
      start,
    );
    assert.notEqual(
      discoveryPaginationResetKey({ ...base, place: 'Amsterdam' }),
      start,
    );
  });
});
