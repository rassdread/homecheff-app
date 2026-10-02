import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  proposalFormInitKey,
  shouldApplyProposalFormInit,
} from './proposal-form-init';

describe('proposal form init', () => {
  it('applies the listing default once, then keeps the buyer choice', () => {
    const first = proposalFormInitKey('conv-1', 'listing-1');
    assert.equal(shouldApplyProposalFormInit(null, first), true);
    assert.equal(shouldApplyProposalFormInit(first, first), false);
    const refreshed = proposalFormInitKey('conv-1', 'listing-1');
    assert.equal(shouldApplyProposalFormInit(first, refreshed), false);
  });

  it('applies the listing default when the product arrives after an empty header', () => {
    const empty = proposalFormInitKey('conv-1', null);
    const withProduct = proposalFormInitKey('conv-1', 'listing-1');
    assert.equal(shouldApplyProposalFormInit(empty, withProduct), true);
    assert.equal(shouldApplyProposalFormInit(withProduct, empty), false);
  });
});
