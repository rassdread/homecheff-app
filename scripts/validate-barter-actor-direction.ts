/**
 * Barter actor-direction labels — presentation only.
 * Run: npx tsx scripts/validate-barter-actor-direction.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveBuyerConsiderationLabelKey,
  resolveSellerTargetLabelKey,
  resolveValuePickerHeadingKey,
} from '../lib/proposals/proposal-barter-actor-labels';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const buyer = 'buyer-1';
const seller = 'seller-1';

// A — seller views buyer proposal
assert.equal(
  resolveBuyerConsiderationLabelKey({
    currentUserId: seller,
    buyerId: buyer,
    sellerId: seller,
    createdById: buyer,
  }),
  'proposal.card.buyerOffers',
);

// B — buyer views own proposal
assert.equal(
  resolveBuyerConsiderationLabelKey({
    currentUserId: buyer,
    buyerId: buyer,
    sellerId: seller,
    createdById: buyer,
  }),
  'proposal.card.youOffer',
);

// C — seller views own counter
assert.equal(
  resolveBuyerConsiderationLabelKey({
    currentUserId: seller,
    buyerId: buyer,
    sellerId: seller,
    createdById: seller,
  }),
  'proposal.card.youAskConsideration',
);

// C/D — buyer views seller counter
assert.equal(
  resolveBuyerConsiderationLabelKey({
    currentUserId: buyer,
    buyerId: buyer,
    sellerId: seller,
    createdById: seller,
  }),
  'proposal.card.sellerAsks',
);

// Agreement framing
assert.equal(
  resolveBuyerConsiderationLabelKey(
    {
      currentUserId: seller,
      buyerId: buyer,
      sellerId: seller,
      createdById: buyer,
    },
    { asAgreement: true },
  ),
  'proposal.card.buyerDelivers',
);
assert.equal(
  resolveSellerTargetLabelKey({ asAgreement: true }),
  'proposal.card.sellerDelivers',
);

assert.equal(
  resolveValuePickerHeadingKey({
    currentUserId: seller,
    buyerId: buyer,
    sellerId: seller,
  }),
  'marketplace.acceptedValues.askBuyerConsiderationHeading',
);
assert.equal(
  resolveValuePickerHeadingKey({
    currentUserId: buyer,
    buyerId: buyer,
    sellerId: seller,
  }),
  'marketplace.acceptedValues.offeredInReturnHeading',
);

const card = read('components/chat/proposals/ProposalCard.tsx');
assert.match(card, /resolveBuyerConsiderationLabelKey/);
assert.doesNotMatch(card, /PROPOSAL_I18N\.seeksLabel/);

const deal = read('components/chat/proposals/DealCard.tsx');
assert.match(deal, /asAgreement: true/);
assert.doesNotMatch(deal, /PROPOSAL_I18N\.seeksLabel/);

const nl = read('public/i18n/nl.json');
assert.match(nl, /"buyerOffers": "Koper biedt aan"/);
assert.match(nl, /"youOffer": "Jij biedt aan"/);
assert.match(nl, /"youAskConsideration": "Je vraagt als tegenprestatie"/);
assert.match(nl, /"sellerAsks": "De aanbieder vraagt"/);
assert.match(nl, /"buyerDelivers": "Koper levert"/);
assert.match(nl, /"sellerDelivers": "Verkoper levert"/);
// Ambiguous screenshot string must not remain as primary seeksLabel meaning
assert.match(nl, /"seeksLabel": "Tegenprestatie van koper"/);

const en = read('public/i18n/en.json');
assert.match(en, /"buyerOffers": "Buyer offers"/);
assert.match(en, /"sellerAsks": "Seller asks in return"/);

console.log('validate-barter-actor-direction: OK');
