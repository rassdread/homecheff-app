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

  it('keeps published inspiration mirrors discoverable as products when priced', () => {
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

  it('allows PUBLISHED dish mirrors even at zero price', () => {
    assert.equal(
      isUnpublishedInspirationProductMirror({
        priceCents: 0,
        linkedDishStatus: 'PUBLISHED',
      }),
      false,
    );
  });
});
