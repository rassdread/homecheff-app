/**
 * Negotiation role integrity — buyer pays, seller waits.
 * Run: npx tsx scripts/validate-proposal-negotiation-role-flow.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isHomecheffCheckoutPayer,
  resolveDealUxState,
} from '../lib/proposals/deal-ux-state';
import type { CommunityOrderDTO, ProposalDTO } from '../lib/proposals/proposal-types';

const buyerId = 'buyer-1';
const sellerId = 'seller-1';

const proposal = {
  id: 'p1',
  conversationId: 'c1',
  createdById: buyerId,
  sellerId,
  buyerId,
  productId: 'prod-1',
  listingId: null,
  title: 'Design Studio',
  description: 'edit photo',
  quantity: 1,
  amountCents: 200,
  currency: 'EUR',
  requestedDate: null,
  requestedTimeWindow: null,
  fulfillmentType: 'PICKUP',
  category: 'PRODUCT',
  settlementMode: 'MONEY',
  acceptedValueTaxonomyIds: [],
  requestedValueTaxonomyIds: [],
  proposalSummary: {
    settlementMode: 'MONEY',
    amountCents: 200,
    currency: 'EUR',
    acceptedValueTaxonomyIds: [],
    requestedValueTaxonomyIds: [],
    title: 'Design Studio',
    quantity: 1,
    fulfillmentType: 'PICKUP',
    paymentPath: 'HOMECHEFF_CHECKOUT',
    priceModel: 'ON_REQUEST',
    productId: 'prod-1',
  },
  status: 'ACCEPTED',
  parentProposalId: null,
  expiresAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as ProposalDTO;

const communityOrder = {
  id: 'co1',
  agreementId: 'a1',
  proposalId: 'p1',
  conversationId: 'c1',
  buyerId,
  sellerId,
  status: 'OPEN',
  fulfillmentMode: 'PICKUP',
  deliveryRequested: false,
  deliveryAssigned: false,
  checkoutOrderId: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as CommunityOrderDTO;

assert.equal(
  isHomecheffCheckoutPayer({ currentUserId: buyerId, buyerId }),
  true,
);
assert.equal(
  isHomecheffCheckoutPayer({ currentUserId: sellerId, buyerId }),
  false,
);

const buyerUx = resolveDealUxState({
  proposal,
  communityOrder,
  currentUserId: buyerId,
});
assert.equal(buyerUx.primaryCta.kind, 'PAY_CHECKOUT');
assert.ok(buyerUx.primaryCta.href);

const sellerUx = resolveDealUxState({
  proposal,
  communityOrder,
  currentUserId: sellerId,
});
assert.equal(sellerUx.primaryCta.kind, 'WAIT_FOR_PAYMENT');
assert.equal(sellerUx.primaryCta.href, null);
assert.equal(sellerUx.checkoutUrl, null);
assert.match(sellerUx.statusLabelKey, /waitingBuyerPayment/);

const sheet = readFileSync(
  join(process.cwd(), 'components/chat/proposals/DealCard.tsx'),
  'utf8',
);
assert.match(sheet, /currentUserId/);
assert.match(sheet, /WAIT_FOR_PAYMENT/);

const card = readFileSync(
  join(process.cwd(), 'components/chat/proposals/ProposalCard.tsx'),
  'utf8',
);
assert.match(card, /proposal\.status\.received/);
assert.match(card, /awaitingCounterpart/);
assert.match(card, /currentUserId=\{currentUserId\}/);

const service = readFileSync(
  join(process.cwd(), 'lib/proposals/proposal-service.ts'),
  'utf8',
);
assert.match(service, /Cannot accept your own proposal/);
assert.match(service, /status: 'COUNTERED'/);

console.log('HOMECHEFF_PROPOSAL_NEGOTIATION_ROLE_FLOW_VALIDATED');
