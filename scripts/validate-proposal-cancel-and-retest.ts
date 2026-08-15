/**
 * Cancel + negotiation retest static validators.
 * Run: npx tsx scripts/validate-proposal-cancel-and-retest.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isHomecheffCheckoutPayer,
  resolveDealUxState,
} from '../lib/proposals/deal-ux-state';
import type { CommunityOrderDTO, ProposalDTO } from '../lib/proposals/proposal-types';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const cancelService = read('lib/trust/community-order-service.ts');
assert.match(cancelService, /cancelCommunityOrder/);
assert.match(cancelService, /proposal\.updateMany/);
assert.match(cancelService, /checkoutOrderId/);
assert.doesNotMatch(cancelService, /\$delete|deleteMany\(\s*\{\s*where:\s*\{\s*id:\s*communityOrderId/);
assert.doesNotMatch(cancelService, /stripe\./i);

const cancelProposal = read('lib/proposals/proposal-service.ts');
assert.match(cancelProposal, /static async cancelProposal/);
assert.match(cancelProposal, /Only the creator can cancel/);
assert.match(cancelProposal, /status !== 'PENDING'/);
assert.match(cancelProposal, /CANCELLED/);

const proposalCard = read('components/chat/proposals/ProposalCard.tsx');
assert.match(proposalCard, /canCancel = proposal\.status === "PENDING" && isCreator/);
assert.match(proposalCard, /PROPOSAL_I18N\.cancelConfirm/);
assert.match(proposalCard, /runAction\("accept"\)|handleAccept/);
assert.match(proposalCard, /setShowCounter\(true\)/);
assert.match(proposalCard, /runAction\("reject"\)/);
assert.match(proposalCard, /PROPOSAL_I18N\.actions\.accept/);
assert.match(proposalCard, /PROPOSAL_I18N\.actions\.counter/);
assert.match(proposalCard, /PROPOSAL_I18N\.actions\.reject/);

const chatDeal = read('components/chat/proposals/DealCard.tsx');
assert.match(chatDeal, /\/api\/community-orders\/\$\{order\.id\}\/cancel/);
assert.match(chatDeal, /PROFILE_DEALS_I18N\.cancelConfirm/);
assert.match(chatDeal, /order\.status === 'OPEN'/);

const profileDeal = read('components/profile/ProfileDealCard.tsx');
assert.match(profileDeal, /\/api\/community-orders\/\$\{deal\.id\}\/cancel/);
assert.match(profileDeal, /window\.confirm/);

const nl = read('public/i18n/nl.json');
assert.match(nl, /"cancel": "Voorstel intrekken"/);
assert.match(nl, /"reject": "Weigeren"/);
assert.match(nl, /"counter": "Tegenbod doen"/);
assert.match(nl, /"cancelConfirm": "Wil je deze afspraak annuleren\?"/);
assert.match(nl, /"cancelConfirm": "Wil je dit voorstel intrekken\?"/);

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
  description: null,
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

const cancelledOrder = {
  id: 'co1',
  agreementId: 'a1',
  proposalId: 'p1',
  conversationId: 'c1',
  buyerId,
  sellerId,
  status: 'CANCELLED',
  fulfillmentMode: 'PICKUP',
  deliveryRequested: false,
  deliveryAssigned: false,
  checkoutOrderId: null,
  completedAt: null,
  cancelledAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as CommunityOrderDTO;

const cancelledUx = resolveDealUxState({
  proposal: { ...proposal, status: 'CANCELLED' } as ProposalDTO,
  communityOrder: cancelledOrder,
  currentUserId: buyerId,
});
assert.equal(cancelledUx.primaryCta.kind, 'COMPLETE');
assert.equal(cancelledUx.primaryCta.href, null);
assert.equal(cancelledUx.checkoutUrl, null);
assert.equal(cancelledUx.showPaymentRequired, false);
assert.match(cancelledUx.statusLabelKey, /cancelled/);
assert.equal(isHomecheffCheckoutPayer({ currentUserId: buyerId, buyerId }), true);

console.log('validate-proposal-cancel-and-retest: OK');
