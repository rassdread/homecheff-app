/**
 * Proposal submit stock gate — ON_REQUEST negotiation vs FIXED cart.
 * Run: npx tsx scripts/validate-proposal-submit-stock-gate.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateProposalQuantityAgainstStock } from '../lib/proposals/proposal-stock-policy';
import { proposalNegotiationIgnoresStockAvailability } from '../lib/proposals/proposal-stock-policy';
import {
  EMPTY_PROPOSAL_FORM,
  type ProposalFormValues,
} from '../lib/proposals/proposal-form-types';
import { validateProposalReadiness } from '../lib/proposals/proposal-readiness';

assert.equal(
  proposalNegotiationIgnoresStockAvailability({ priceModel: 'ON_REQUEST' }),
  true,
);
assert.equal(
  proposalNegotiationIgnoresStockAvailability({ priceModel: 'FIXED' }),
  false,
);
assert.equal(
  proposalNegotiationIgnoresStockAvailability({
    priceModel: 'FIXED',
    fulfillmentOptions: { digital: true },
  }),
  true,
);
assert.equal(
  proposalNegotiationIgnoresStockAvailability({
    priceModel: 'FIXED',
    marketplaceCategory: 'ARTISTIC_SERVICE',
  }),
  true,
);

assert.equal(
  validateProposalQuantityAgainstStock(0, 1, { priceModel: 'ON_REQUEST' }).ok,
  true,
  'ON_REQUEST stock=0 allows proposal qty',
);
assert.equal(
  validateProposalQuantityAgainstStock(0, 1, { priceModel: 'FIXED' }).ok,
  false,
  'FIXED stock=0 still blocks',
);

const designStudio: ProposalFormValues = {
  ...EMPTY_PROPOSAL_FORM,
  title: 'HomeCheff Design Studio',
  description: 'kan je 1 foto voor me bewerken',
  quantity: '1',
  amountEuros: '2',
  settlementMode: 'MONEY',
  paymentPath: 'HOMECHEFF_CHECKOUT',
  requestedDate: '2026-08-16',
  requestedTimeWindow: '15:00',
  fulfillmentType: 'PICKUP',
};

const readiness = validateProposalReadiness({
  form: designStudio,
  product: {
    id: 'design-studio',
    barterOpenness: 'MONEY',
    availableStock: 0,
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    canHomeCheffCheckout: true,
    sellerStripeReady: true,
    isActive: true,
    priceModel: 'ON_REQUEST',
    marketplaceCategory: 'DESIGN',
    fulfillmentDigital: true,
  },
  isAuthenticated: true,
});
assert.equal(readiness.ok, true, 'Design Studio ON_REQUEST stock=0 submit ready');

const fixedBlocked = validateProposalReadiness({
  form: designStudio,
  product: {
    id: 'fixed-item',
    barterOpenness: 'MONEY',
    availableStock: 0,
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    canHomeCheffCheckout: true,
    sellerStripeReady: true,
    isActive: true,
    priceModel: 'FIXED',
    marketplaceCategory: 'CREATE',
  },
  isAuthenticated: true,
});
assert.equal(fixedBlocked.ok, false, 'FIXED stock=0 still blocked');
assert.equal(
  !fixedBlocked.ok && fixedBlocked.errorKey,
  'proposal.productBinding.outOfStock',
);

const moneyZero = validateProposalReadiness({
  form: { ...designStudio, amountEuros: '0' },
  product: {
    id: 'design-studio',
    barterOpenness: 'MONEY',
    availableStock: 0,
    acceptHomeCheffPayment: true,
    acceptDirectContact: true,
    canHomeCheffCheckout: true,
    sellerStripeReady: true,
    isActive: true,
    priceModel: 'ON_REQUEST',
  },
  isAuthenticated: true,
});
assert.equal(moneyZero.ok, false);

const sheet = readFileSync(
  join(process.cwd(), 'components/chat/proposals/CreateProposalSheet.tsx'),
  'utf8',
);
assert.match(sheet, /liveReadiness/);
assert.match(sheet, /submitBlockedReason/);
assert.doesNotMatch(
  sheet,
  /disabled=\{busy \|\| \(maxQuantity != null && maxQuantity <= 0\)\}/,
);

console.log('HOMECHEFF_PROPOSAL_SUBMIT_STOCK_GATE_VALIDATED');
