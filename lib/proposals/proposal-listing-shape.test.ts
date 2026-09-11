/**
 * Unit helpers for product vs service proposal field visibility.
 */
import assert from 'node:assert/strict';
import {
  proposalShowsFulfillmentField,
  proposalShowsQuantityField,
  resolveProposalListingShape,
} from './proposal-listing-shape';

assert.equal(
  resolveProposalListingShape({ marketplaceCategory: 'FOOD' }),
  'PRODUCT',
);
assert.equal(
  resolveProposalListingShape({ marketplaceCategory: 'PRACTICAL_SERVICE' }),
  'SERVICE',
);
assert.equal(
  resolveProposalListingShape({ listingKind: 'SERVICE' }),
  'SERVICE',
);
assert.equal(
  resolveProposalListingShape({ priceModel: 'HOURLY' }),
  'SERVICE',
);

assert.equal(proposalShowsQuantityField('PRODUCT'), true);
assert.equal(proposalShowsQuantityField('SERVICE'), false);
assert.equal(proposalShowsFulfillmentField('SERVICE', 0), false);
assert.equal(proposalShowsFulfillmentField('SERVICE', 2), true);
assert.equal(proposalShowsFulfillmentField('PRODUCT', 2), true);

console.log('proposal-listing-shape: ok');
