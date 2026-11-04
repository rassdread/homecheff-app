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

  it('publishes CHEFF complete recipe when ingredients and steps are present', () => {
    const result = resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
      ingredients: ['bloem'],
      instructions: ['bakken'],
    });
    assert.equal(result.status, 'PUBLISHED');
    assert.equal(result.heldAsDraft, false);
  });

  it('publishes CHEFF cooking inspiration with ingredients and no steps', () => {
    const result = resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
      ingredients: ['200 gr. boter', '200 gr. chocola'],
      instructions: [],
      description: 'Recept Brownie : - 200 gr. boter',
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

  it('keeps an explicit private save private for designer and garden', () => {
    for (const category of ['DESIGNER', 'GROWN'] as const) {
      const result = resolveInspirationPublishStatus('PRIVATE', category, {
        notes: 'bewaar als concept',
        materials: ['linnen'],
        plantType: 'munt',
        soilType: 'potgrond',
      });
      assert.equal(result.status, 'PRIVATE');
      assert.equal(result.heldAsDraft, false);
    }
  });

  it('publishes designer and garden when publication is requested and a guide exists', () => {
    assert.equal(
      resolveInspirationPublishStatus('PUBLISHED', 'DESIGNER', { notes: 'zoom' }).status,
      'PUBLISHED',
    );
    assert.equal(
      resolveInspirationPublishStatus('PUBLISHED', 'GROWN', { notes: 'water geven' }).status,
      'PUBLISHED',
    );
  });

  it('routes inspiration intent to category templates', () => {
    assert.equal(resolvePublicCreateSurface('inspiration', 'chef'), 'recipe');
    assert.equal(resolvePublicCreateSurface('inspiration', 'tuin'), 'garden');
    assert.equal(resolvePublicCreateSurface('inspiration', 'designer'), 'design');
    assert.equal(resolvePublicCreateSurface('offer', 'chef'), 'marketplace-offer');
  });
});
