import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseStockInput, parseStockInputOrZero } from './parse-stock-input';

describe('parseStockInput', () => {
  it('keeps zero instead of treating it as empty', () => {
    assert.equal(parseStockInput('0'), 0);
    assert.equal(parseStockInput(0), 0);
    assert.equal(parseStockInputOrZero('0'), 0);
  });

  it('parses positive stock and skips empty', () => {
    assert.equal(parseStockInput('5'), 5);
    assert.equal(parseStockInput(''), undefined);
    assert.equal(parseStockInputOrZero(''), 0);
    assert.equal(parseStockInput('abc'), undefined);
  });
});
