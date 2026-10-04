import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  offerCarriesStructuredGuide,
  resolveInspirationPublishStatus,
  resolvePublicCreateSurface,
} from './guide-requirements';
import { buildInstructionContent } from './instruction-content';
import { publicSubcategoryLabel } from '../marketplace/public-subcategory-label';
import {
  getDisplayName,
  PUBLIC_DISPLAY_FALLBACK,
  PUBLIC_DISPLAY_FALLBACK_EN,
} from '../displayName';

test('food design and garden offers without a guide do not mirror a dish', () => {
  assert.equal(offerCarriesStructuredGuide('CHEFF', { ingredients: [], instructions: [] }), false);
  assert.equal(offerCarriesStructuredGuide('DESIGNER', { materials: [], instructions: [], notes: '' }), false);
  assert.equal(
    offerCarriesStructuredGuide('GROWN', {
      notes: '',
      plantType: 'tomaat',
    }),
    false,
  );
});

test('inspiration with a real guide may publish', () => {
  assert.equal(
    resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
      ingredients: ['brie'],
      instructions: ['beleg de tosti'],
    }).status,
    'PUBLISHED',
  );
  assert.equal(
    resolveInspirationPublishStatus('PUBLISHED', 'DESIGNER', { materials: ['hout'] }).status,
    'PUBLISHED',
  );
  assert.equal(
    resolveInspirationPublishStatus('PUBLISHED', 'GROWN', { notes: 'Geef water bij droogte.' }).status,
    'PUBLISHED',
  );
});

test('empty inspiration stays a private draft', () => {
  const held = resolveInspirationPublishStatus('PUBLISHED', 'CHEFF', {
    ingredients: [],
    instructions: [],
  });
  assert.equal(held.status, 'PRIVATE');
  assert.equal(held.heldAsDraft, true);
});

test('intent chooses the form before category', () => {
  assert.equal(resolvePublicCreateSurface('offer', 'keuken'), 'marketplace-offer');
  assert.equal(resolvePublicCreateSurface('inspiration', 'keuken'), 'recipe');
  assert.equal(resolvePublicCreateSurface('inspiration', 'tuin'), 'garden');
  assert.equal(resolvePublicCreateSurface('inspiration', 'atelier'), 'design');
});

test('recipe guide renders ingredients and steps', () => {
  const content = buildInstructionContent({
    category: 'CHEFF',
    ingredients: ['brie', 'tomaat'],
    instructions: ['Beleg het brood', 'Bak de tosti'],
    materials: [],
    stepPhotos: [],
    growthPhotos: [],
  });
  assert.equal(content.hasInstructionContent, true);
  assert.deepEqual(content.supplies, ['brie', 'tomaat']);
  assert.equal(content.steps.length, 2);
});

test('design guide renders materials and making steps', () => {
  const content = buildInstructionContent({
    category: 'DESIGNER',
    ingredients: [],
    instructions: ['Zaag de plank'],
    materials: ['hout'],
    stepPhotos: [],
    growthPhotos: [],
  });
  assert.equal(content.hasInstructionContent, true);
  assert.deepEqual(content.supplies, ['hout']);
  assert.equal(content.steps[0]?.text, 'Zaag de plank');
});

test('garden notes render as the growing guide', () => {
  const content = buildInstructionContent({
    category: 'GROWN',
    ingredients: [],
    instructions: [],
    materials: [],
    stepPhotos: [],
    growthPhotos: [],
    notes: 'Plant in mei. Geef water bij droogte.',
  });
  assert.equal(content.hasInstructionContent, true);
  assert.ok(content.steps.some((step) => step.text.includes('Plant in mei')));
});

test('taxonomy id create.baking renders a human label', () => {
  assert.equal(publicSubcategoryLabel('create.baking', 'nl'), 'Bakken');
  assert.equal(publicSubcategoryLabel('create.baking', 'en'), 'Baking');
});

test('public identity never upgrades toward a hidden real name', () => {
  assert.equal(
    getDisplayName({ name: 'Secret Person', username: 'maker', displayNameOption: 'username' }),
    'maker',
  );
  assert.equal(
    getDisplayName({ name: 'Jan Jansen', username: 'jan', displayNameOption: 'first' }),
    'Jan',
  );
  assert.equal(
    getDisplayName({ name: 'Jan Jansen', username: 'jan', displayNameOption: 'full' }),
    'Jan Jansen',
  );
  assert.equal(
    getDisplayName({ name: 'Secret Person', username: 'maker', displayNameOption: 'none' }),
    'maker',
  );
  assert.equal(
    getDisplayName({ name: 'Secret Person', username: null, displayNameOption: 'none' }),
    PUBLIC_DISPLAY_FALLBACK,
  );
  assert.equal(
    getDisplayName({ name: 'Secret Person', username: null, displayNameOption: 'none' }, 'en'),
    PUBLIC_DISPLAY_FALLBACK_EN,
  );
});

test('certification cleanup unpublishes the dish twin', () => {
  const source = readFileSync(
    new URL('../../scripts/certify-item-edit-flow-production.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /unpublishCertDishTwin/);
  assert.match(source, /status: 'PRIVATE'/);
  assert.match(source, /certCreatedNewListing/);
});
