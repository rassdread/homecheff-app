import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  categoryHasMeaningfulGuide,
  resolveInspirationPublishStatus,
  resolvePublicCreateSurface,
} from './guide-requirements';

describe('inspiration guide publish gate', () => {
  it('holds CHEFF publish as draft without ingredients and instructions', () => {
    const result = resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
      ingredients: [],
      instructions: [],
    });
    assert.equal(result.status, 'PRIVATE');
    assert.equal(result.heldAsDraft, true);
  });

  it('publishes CHEFF when recipe guide is present', () => {
    const result = resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
      ingredients: ['bloem'],
      instructions: ['bakken'],
    });
    assert.equal(result.status, 'PUBLISHED');
    assert.equal(result.heldAsDraft, false);
  });

  it('does not require stock, price, or location for publish decision', () => {
    assert.equal(
      categoryHasMeaningfulGuide('CHEFF', {
        ingredients: ['ei'],
        instructions: ['kloppen'],
      }),
      true,
    );
  });

  it('routes inspiration intent to category templates', () => {
    assert.equal(resolvePublicCreateSurface('inspiration', 'chef'), 'recipe');
    assert.equal(resolvePublicCreateSurface('inspiration', 'tuin'), 'garden');
    assert.equal(resolvePublicCreateSurface('inspiration', 'designer'), 'design');
    assert.equal(resolvePublicCreateSurface('offer', 'chef'), 'marketplace-offer');
  });
});
