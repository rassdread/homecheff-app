import assert from 'node:assert/strict';
import test from 'node:test';
import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { mergeSeededFansCount } from '@/lib/follow/follow-state-store';
import { inspirationApiToCardItem } from '@/lib/marketplace/tiles/map-inspiration-api';
import {
  mapGeoFeedCardToTileModel,
  resolveTileFansCount,
} from '@/lib/marketplace/tiles/map-to-tile-model';

function inspiration(fans: number | undefined, id: string): InspirationItem {
  return {
    id,
    title: id,
    description: null,
    category: 'CHEFF',
    status: 'PUBLISHED',
    createdAt: '2026-11-05T00:00:00.000Z',
    photos: [],
    sellerFansCount: fans,
    user: {
      id: 'seller-1',
      name: 'Lioness',
      username: 'Lioness010',
      profileImage: null,
    },
  };
}

function tileFans(item: GeoFeedCardItem): number | undefined {
  return mapGeoFeedCardToTileModel(item, {
    href: `/inspiratie/${item.id}`,
    mode: 'inspiration',
  }).person?.fansCount;
}

test('a maker with 0 fans stays 0 on the inspiration tile', () => {
  const card = inspirationApiToCardItem(inspiration(0, 'zero'));
  assert.equal(card.sellerFansCount, 0);
  assert.equal(tileFans(card), 0);
});

test('a maker with 1 fan is not dropped', () => {
  const card = inspirationApiToCardItem(inspiration(1, 'one'));
  assert.equal(tileFans(card), 1);
});

test('a maker with several fans keeps that count on every tile', () => {
  const first = inspirationApiToCardItem(inspiration(4, 'product-a'));
  const second = inspirationApiToCardItem(inspiration(4, 'product-b'));
  assert.equal(tileFans(first), 4);
  assert.equal(tileFans(second), 4);
  assert.equal(first.sellerUserId, second.sellerUserId);
});

test('a loaded sale count wins over an empty inspiration default', () => {
  assert.equal(resolveTileFansCount(4, 0), 4);
  assert.equal(resolveTileFansCount(undefined, undefined), undefined);
});

test('a missing inspiration count does not wipe a known fan count', () => {
  assert.equal(mergeSeededFansCount(4, undefined), 4);
  assert.equal(mergeSeededFansCount(4, 0), 0);
  assert.equal(mergeSeededFansCount(undefined, 1), 1);
  assert.equal(mergeSeededFansCount(undefined, undefined), undefined);
});

test('CHEFF, DESIGNER and GROWN inspiration use the same fan field', () => {
  for (const category of ['CHEFF', 'DESIGNER', 'GROWN'] as const) {
    const item = inspiration(3, category);
    item.category = category;
    const card = inspirationApiToCardItem(item);
    assert.equal(card.category, category);
    assert.equal(tileFans(card), 3);
  }
});
