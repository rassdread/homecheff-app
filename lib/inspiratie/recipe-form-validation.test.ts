import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  descriptionLooksLikeUnmappedIngredients,
  validateRecipeFormSave,
} from './recipe-form-validation';

describe('validateRecipeFormSave', () => {
  it('allows PRIVATE draft with ingredients only', () => {
    const result = validateRecipeFormSave({
      title: 'Brownie',
      description: 'Recept…',
      ingredients: ['200 gr. boter'],
      instructions: [''],
      isPrivate: true,
    });
    assert.equal(result.ok, true);
  });

  it('allows PUBLISHED cooking inspiration without instructions', () => {
    const result = validateRecipeFormSave({
      title: 'Brownie',
      description: 'x',
      ingredients: ['boter'],
      instructions: [''],
      isPrivate: false,
    });
    assert.equal(result.ok, true);
  });

  it('still requires ingredients for PUBLISHED', () => {
    const result = validateRecipeFormSave({
      title: 'Brownie',
      description: 'x',
      ingredients: [''],
      instructions: ['bakken'],
      isPrivate: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.errorKey, 'recipe.ingredientRequired');
  });

  it('blocks empty PRIVATE draft without description', () => {
    const result = validateRecipeFormSave({
      title: 'Empty',
      description: '',
      ingredients: [''],
      instructions: [''],
      isPrivate: true,
    });
    assert.equal(result.ok, false);
  });
});

describe('descriptionLooksLikeUnmappedIngredients', () => {
  it('detects dash lists when structured ingredients empty', () => {
    assert.equal(
      descriptionLooksLikeUnmappedIngredients(
        'Recept Brownie : - 200 gr. boter - 200 gr. chocola',
        [''],
      ),
      true,
    );
  });

  it('is quiet when ingredients already structured', () => {
    assert.equal(
      descriptionLooksLikeUnmappedIngredients('Recept…', ['boter']),
      false,
    );
  });
});
