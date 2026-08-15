/**
 * Negotiated proposal HomeCheff Checkout eligibility.
 *
 * Run: npx tsx scripts/validate-proposal-homecheff-eligibility.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  canProposalHomeCheffCheckout,
  isValidProposalCheckoutAmountCents,
  parseProposalAmountEurosToCents,
  proposalHomeCheffCheckoutBlockedReason,
} from '../lib/proposals/proposal-homecheff-eligibility';

const root = process.cwd();

console.log('A–D / I–J amount + Connect matrix');

const base = {
  acceptHomeCheffPayment: true,
  sellerStripeReady: true,
  settlementMode: 'MONEY',
};

assert.equal(
  canProposalHomeCheffCheckout({ ...base, amountCents: null }),
  false,
  'A blank amount disabled',
);
assert.equal(
  proposalHomeCheffCheckoutBlockedReason({ ...base, amountCents: null }),
  'proposal.productBinding.amountRequiredForCheckout',
);
assert.equal(
  canProposalHomeCheffCheckout({ ...base, amountCents: 2500 }),
  true,
  'B €25 enabled',
);
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    sellerStripeReady: false,
    amountCents: 2500,
  }),
  false,
  'C no Connect disabled',
);
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    acceptHomeCheffPayment: false,
    amountCents: 2500,
  }),
  false,
  'D HC opt-out disabled',
);
assert.equal(
  canProposalHomeCheffCheckout({ ...base, amountCents: 0 }),
  false,
  'I €0 disabled',
);
assert.equal(parseProposalAmountEurosToCents(''), null);
assert.equal(parseProposalAmountEurosToCents('-1'), null);
assert.equal(parseProposalAmountEurosToCents('abc'), null);
assert.equal(parseProposalAmountEurosToCents('25'), 2500);
assert.equal(parseProposalAmountEurosToCents('25,50'), 2550);
assert.equal(isValidProposalCheckoutAmountCents(2500), true);
assert.equal(isValidProposalCheckoutAmountCents(0), false);

console.log('Barter / free modes');
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    settlementMode: 'VALUE_ONLY',
    amountCents: 2500,
  }),
  false,
  'H BARTER_ONLY/VALUE_ONLY no HC',
);
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    settlementMode: 'MONEY_AND_VALUE',
    amountCents: 1500,
  }),
  true,
  'G MONEY_AND_BARTER money leg',
);
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    settlementMode: 'FREE',
    amountCents: 2500,
  }),
  false,
  'FREE no HC',
);
assert.equal(
  canProposalHomeCheffCheckout({
    ...base,
    settlementMode: 'VOLUNTARY',
    amountCents: 2500,
  }),
  false,
  'VOLUNTARY no HC',
);

console.log('Source contracts');
const binding = readFileSync(
  join(root, 'lib/proposals/proposal-product-binding.ts'),
  'utf8',
);
assert.match(binding, /sellerEligibleForProposalHomeCheff/);
assert.match(binding, /canListingHomeCheffCheckout/);
assert.match(binding, /amountCents: input\.amountCents/);
assert.doesNotMatch(
  binding,
  /canHomeCheffCheckout =\s*\n\s*acceptsHomeCheff &&\s*\n\s*hasPublicDisplayPrice/,
);

const fields = readFileSync(
  join(root, 'components/chat/proposals/ProposalFieldsSection.tsx'),
  'utf8',
);
assert.match(fields, /canProposalHomeCheffCheckout/);
assert.match(fields, /parseProposalAmountEurosToCents/);

const checkout = readFileSync(join(root, 'app/api/checkout/route.ts'), 'utf8');
assert.match(checkout, /dealPriceCents/);
assert.match(checkout, /isHomecheffCheckoutProduct\(product\)/);

const deleteSrc = readFileSync(
  join(root, 'components/profile/ProductManagement.tsx'),
  'utf8',
);
assert.match(deleteSrc, /data-owner-action="delete"/);
assert.match(deleteSrc, /cardActionBoundaryProps/);
assert.match(deleteSrc, /stopCardNavigation/);

console.log('\nHOMECHEFF_NEGOTIATED_HOMECHEFF_PAYMENT_ELIGIBILITY_VALIDATED');
