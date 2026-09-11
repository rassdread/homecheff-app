/**
 * Unit tests for proposal term diffs.
 * npx tsx --test lib/proposals/proposal-diff.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffFormAgainstProposal, diffProposalTerms } from './proposal-diff';
import type { ProposalDTO } from './proposal-types';
import type { ProposalFormValues } from './proposal-form-types';

function base(over: Partial<ProposalDTO> = {}): ProposalDTO {
  return {
    id: 'p1',
    conversationId: 'c1',
    createdById: 'u1',
    sellerId: 's1',
    buyerId: 'b1',
    productId: 'prod1',
    listingId: null,
    title: 'Item',
    description: 'Hallo',
    quantity: 1,
    amountCents: 4000,
    currency: 'EUR',
    requestedDate: '2026-09-18T00:00:00.000Z',
    requestedTimeWindow: '14:00',
    fulfillmentType: 'PICKUP',
    category: 'PRODUCT',
    settlementMode: 'MONEY',
    acceptedValueTaxonomyIds: [],
    requestedValueTaxonomyIds: [],
    proposalSummary: null,
    status: 'PENDING',
    parentProposalId: null,
    expiresAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...over,
  };
}

describe('diffProposalTerms', () => {
  it('flags price and date changes', () => {
    const parent = base();
    const child = base({
      id: 'p2',
      amountCents: 3500,
      requestedDate: '2026-09-19T00:00:00.000Z',
      parentProposalId: 'p1',
    });
    const d = diffProposalTerms(parent, child);
    assert.ok(d.some((x) => x.field === 'amount'));
    assert.ok(d.some((x) => x.field === 'date'));
    assert.equal(d.find((x) => x.field === 'amount')?.toLabel.includes('35'), true);
  });

  it('returns empty when unchanged', () => {
    assert.equal(diffProposalTerms(base(), base({ id: 'p2' })).length, 0);
  });
});

describe('diffFormAgainstProposal', () => {
  it('detects form amount edit', () => {
    const form: ProposalFormValues = {
      title: 'Item',
      description: 'Hallo',
      quantity: '1',
      amountEuros: '35',
      requestedDate: '2026-09-18',
      requestedTimeWindow: '14:00',
      fulfillmentType: 'PICKUP',
      settlementMode: 'MONEY',
      paymentPath: 'HOMECHEFF_CHECKOUT',
      acceptedValueTaxonomyIds: [],
      requestedValueTaxonomyIds: [],
      barterOfferImageUrls: [],
    };
    const d = diffFormAgainstProposal(base(), form);
    assert.ok(d.some((x) => x.field === 'amount'));
  });
});
