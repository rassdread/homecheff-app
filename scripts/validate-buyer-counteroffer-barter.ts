/**
 * Buyer counter-offer barter UX + optional barter media.
 * Run: npx tsx scripts/validate-buyer-counteroffer-barter.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  allowedBuyerProposalSettlementModes,
  allowedSettlementModesForBarterOpenness,
  sellerBarterPreferenceHintKey,
} from '../lib/marketplace/commerce/barter-commerce-alignment';
import { normalizeBarterOfferImageUrls } from '../lib/proposals/barter-offer-images';
import {
  EMPTY_PROPOSAL_FORM,
  type ProposalFormValues,
} from '../lib/proposals/proposal-form-types';
import { validateProposalReadiness } from '../lib/proposals/proposal-readiness';

const root = process.cwd();

const ALL = allowedBuyerProposalSettlementModes('MONEY');
assert.deepEqual(
  ALL,
  ['MONEY', 'VALUE_ONLY', 'MONEY_AND_VALUE', 'FREE', 'VOLUNTARY'],
);
assert.ok(ALL.includes('VALUE_ONLY'));
assert.ok(allowedBuyerProposalSettlementModes('BARTER_ONLY').includes('MONEY'));
assert.ok(
  !allowedSettlementModesForBarterOpenness('MONEY').includes('VALUE_ONLY'),
  'listing preference filter unchanged',
);

assert.equal(sellerBarterPreferenceHintKey('MONEY'), 'proposal.preference.money');
assert.equal(
  sellerBarterPreferenceHintKey('MONEY_AND_BARTER'),
  'proposal.preference.moneyAndBarter',
);
assert.equal(
  sellerBarterPreferenceHintKey('BARTER_ONLY'),
  'proposal.preference.barterOnly',
);

const moneyListingProduct = {
  id: 'p1',
  barterOpenness: 'MONEY',
  availableStock: 5,
  acceptHomeCheffPayment: true,
  acceptDirectContact: true,
  canHomeCheffCheckout: true,
  sellerStripeReady: true,
  isActive: true,
};

const ruilen: ProposalFormValues = {
  ...EMPTY_PROPOSAL_FORM,
  title: 'Ruil hulp',
  settlementMode: 'VALUE_ONLY',
  requestedValueTaxonomyIds: ['create.meal'],
  description: 'Zelfgemaakte soep',
  barterOfferImageUrls: [
    'https://blob.example.com/a.jpg',
    'https://blob.example.com/b.jpg',
    'data:image/png;base64,abc',
  ],
};

assert.equal(
  validateProposalReadiness({
    form: ruilen,
    product: moneyListingProduct,
    isAuthenticated: true,
  }).ok,
  true,
  'MONEY listing + Ruilen proposal allowed',
);

assert.deepEqual(
  normalizeBarterOfferImageUrls(ruilen.barterOfferImageUrls),
  ['https://blob.example.com/a.jpg', 'https://blob.example.com/b.jpg'],
);

assert.equal(
  validateProposalReadiness({
    form: {
      ...EMPTY_PROPOSAL_FORM,
      title: 'Geld + ruil',
      settlementMode: 'MONEY_AND_VALUE',
      amountEuros: '40',
      requestedValueTaxonomyIds: ['grow.tomato'],
      paymentPath: 'HOMECHEFF_CHECKOUT',
    },
    product: moneyListingProduct,
    isAuthenticated: true,
  }).ok,
  true,
  'MONEY listing + Geld+ruilen allowed',
);

assert.equal(
  validateProposalReadiness({
    form: {
      ...EMPTY_PROPOSAL_FORM,
      title: 'Geld op barter listing',
      settlementMode: 'MONEY',
      amountEuros: '25',
      paymentPath: 'DIRECT_CONTACT',
    },
    product: { ...moneyListingProduct, barterOpenness: 'BARTER_ONLY' },
    isAuthenticated: true,
  }).ok,
  true,
  'BARTER_ONLY listing + money counter-offer allowed',
);

const fields = readFileSync(
  join(root, 'components/chat/proposals/ProposalFieldsSection.tsx'),
  'utf8',
);
assert.match(fields, /BarterOfferImageUploader/);
assert.match(fields, /sellerBarterPreferenceHintKey/);
assert.match(fields, /PROPOSAL_POLISH_I18N\.summary\.moneyPayment|moneyPayment/);
assert.ok(
  fields.indexOf('proposal.offerHeading') <
    fields.indexOf('marketplace.form.titleLabel'),
);
assert.ok(
  fields.indexOf('showValuePicker') < fields.indexOf('showPaymentPath ?'),
);

const sheet = readFileSync(
  join(root, 'components/chat/proposals/CreateProposalSheet.tsx'),
  'utf8',
);
assert.match(sheet, /allowedBuyerProposalSettlementModes/);

const counter = readFileSync(
  join(root, 'components/chat/proposals/CounterProposalForm.tsx'),
  'utf8',
);
assert.match(counter, /allowedBuyerProposalSettlementModes/);
assert.doesNotMatch(counter, /allowedSettlementModesForBarterOpenness\(null\)/);

const service = readFileSync(join(root, 'lib/proposals/proposal-service.ts'), 'utf8');
assert.match(service, /allowedBuyerProposalSettlementModes/);
assert.doesNotMatch(service, /validateSettlementAgainstBarterOpenness/);

const nl = JSON.parse(readFileSync(join(root, 'public/i18n/nl.json'), 'utf8'));
assert.equal(nl.proposal.settlement.valueOnly, 'Ruilen');
assert.equal(nl.proposal.settlement.moneyAndValue, 'Geld + ruilen');

console.log('HOMECHEFF_BUYER_COUNTEROFFER_BARTER_VALIDATED');
