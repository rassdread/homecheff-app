import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fillMissingDishMediaFromProductImages,
  type FeedMediaMetaRow,
} from '@/lib/feed/resolve-feed-media-url';

const photo = (url: string): FeedMediaMetaRow => ({
  sortOrder: 0,
  httpUrl: url,
  isLegacyInline: false,
});

describe('dish photo fallback', () => {
  it('uses the product gallery only when the dish has no photos', () => {
    const dishes = new Map<string, FeedMediaMetaRow[]>([
      ['brownie', [photo('https://cdn.example/brownie.jpg')]],
    ]);
    const products = new Map<string, FeedMediaMetaRow[]>([
      ['brownie', [photo('https://cdn.example/product-brownie.jpg')]],
      ['crumble', [photo('https://cdn.example/crumble.jpg')]],
    ]);

    fillMissingDishMediaFromProductImages(dishes, products, [
      'brownie',
      'crumble',
      'missing',
    ]);

    assert.equal(dishes.get('brownie')?.[0]?.httpUrl, 'https://cdn.example/brownie.jpg');
    assert.equal(dishes.get('crumble')?.[0]?.httpUrl, 'https://cdn.example/crumble.jpg');
    assert.equal(dishes.has('missing'), false);
  });
});
