import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isUnpublishedInspirationProductMirror } from './unpublished-inspiration-mirror';

describe('isUnpublishedInspirationProductMirror', () => {
  it('hides zero-price products mirrored by a PRIVATE dish', () => {
    assert.equal(
      isUnpublishedInspirationProductMirror({
        priceCents: 0,
        linkedDishStatus: 'PRIVATE',
      }),
      true,
    );
  });

  it('keeps priced product mirrors discoverable as sale products', () => {
    assert.equal(
      isUnpublishedInspirationProductMirror({
        priceCents: 1500,
        linkedDishStatus: 'PRIVATE',
      }),
      false,
    );
  });

  it('keeps ordinary products without a dish', () => {
    assert.equal(
      isUnpublishedInspirationProductMirror({
        priceCents: 0,
        linkedDishStatus: null,
      }),
      false,
    );
  });

  it('hides PUBLISHED zero-price dish mirrors from Marketplace sale feed', () => {
    assert.equal(
      isUnpublishedInspirationProductMirror({
        priceCents: 0,
        linkedDishStatus: 'PUBLISHED',
      }),
      true,
    );
  });
});
