/**
 * Counter proposal payment-path parity with create flow.
 * Run: npx tsx scripts/validate-counter-payment-path-parity.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateProposalReadiness } from '../lib/proposals/proposal-readiness';
import { EMPTY_PROPOSAL_FORM } from '../lib/proposals/proposal-form-types';
import { canProposalHomeCheffCheckout } from '../lib/proposals/proposal-homecheff-eligibility';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const counter = read('components/chat/proposals/CounterProposalForm.tsx');
assert.match(counter, /product=\{product\}/);
assert.match(counter, /loadCounterProduct|\/api\/conversations\//);
assert.match(counter, /canProposalHomeCheffCheckout/);
assert.match(counter, /requirePaymentPathForMoney/);
assert.match(counter, /submitBlockedReason/);
assert.doesNotMatch(
  counter,
  /allowedSettlementModesForBarterOpenness\(null\)/,
);

const fields = read('components/chat/proposals/ProposalFieldsSection.tsx');
assert.match(fields, /canProposalHomeCheffCheckout/);
assert.match(fields, /showPaymentPath = showMoneyField && Boolean\(product\)/);

const summary = read('components/chat/proposals/ProposalSummaryPreview.tsx');
assert.match(summary, /summary\.settlement/);
assert.match(summary, /summary\.moneyLeg/);
assert.match(summary, /summary\.barterLeg/);
assert.match(summary, /summary\.moneyPayment/);
assert.match(summary, /PROPOSAL_I18N\.settlement\[form\.settlementMode\]/);
assert.ok(
  summary.indexOf('summary.settlement') <
    summary.indexOf('summary.moneyPayment'),
  'settlement section appears before money payment section',
);

const service = read('lib/proposals/proposal-service.ts');
assert.match(
  service,
  /sellerId: input\.sellerId \?\? parent\.sellerId/,
);
assert.match(
  service,
  /buyerId: input\.buyerId \?\? parent\.buyerId/,
);

const dealUx = read('lib/proposals/deal-ux-state.ts');
assert.match(dealUx, /isHomecheffCheckoutPayer/);
assert.match(dealUx, /WAIT_FOR_PAYMENT/);

const product = {
  id: 'p1',
  barterOpenness: 'MONEY',
  availableStock: null,
  acceptHomeCheffPayment: true,
  acceptDirectContact: true,
  canHomeCheffCheckout: true,
  sellerStripeReady: true,
  isActive: true as const,
  priceModel: 'ON_REQUEST',
};

assert.equal(
  canProposalHomeCheffCheckout({
    acceptHomeCheffPayment: true,
    sellerStripeReady: true,
    settlementMode: 'MONEY_AND_VALUE',
    amountCents: 100,
  }),
  true,
);

assert.equal(
  validateProposalReadiness({
    form: {
      ...EMPTY_PROPOSAL_FORM,
      title: '€1 + Taart',
      settlementMode: 'MONEY_AND_VALUE',
      amountEuros: '1',
      requestedValueTaxonomyIds: ['create.baking'],
      paymentPath: 'NONE',
    },
    product,
    isAuthenticated: true,
    requirePaymentPathForMoney: true,
  }).ok,
  false,
);

const missingPath = validateProposalReadiness({
  form: {
    ...EMPTY_PROPOSAL_FORM,
    title: '€1 + Taart',
    settlementMode: 'MONEY_AND_VALUE',
    amountEuros: '1',
    requestedValueTaxonomyIds: ['create.baking'],
    paymentPath: 'NONE',
  },
  product,
  isAuthenticated: true,
  requirePaymentPathForMoney: true,
});
assert.equal(missingPath.ok, false);
if (!missingPath.ok) {
  assert.equal(
    missingPath.errorKey,
    'proposal.productBinding.paymentPathRequired',
  );
}

assert.equal(
  validateProposalReadiness({
    form: {
      ...EMPTY_PROPOSAL_FORM,
      title: '€1 + Taart',
      settlementMode: 'MONEY_AND_VALUE',
      amountEuros: '1',
      requestedValueTaxonomyIds: ['create.baking'],
      paymentPath: 'HOMECHEFF_CHECKOUT',
    },
    product,
    isAuthenticated: true,
    requirePaymentPathForMoney: true,
  }).ok,
  true,
);

assert.equal(
  validateProposalReadiness({
    form: {
      ...EMPTY_PROPOSAL_FORM,
      title: 'Alleen taart',
      settlementMode: 'VALUE_ONLY',
      requestedValueTaxonomyIds: ['create.baking'],
      paymentPath: 'NONE',
    },
    product: { ...product, barterOpenness: 'BARTER_ONLY' },
    isAuthenticated: true,
    requirePaymentPathForMoney: true,
  }).ok,
  true,
);

const nl = read('public/i18n/nl.json');
assert.match(nl, /"settlement": "Afspraak"/);
assert.match(nl, /"moneyLeg": "Gelddeel"/);
assert.match(nl, /"barterLeg": "Ruildeel"/);
assert.match(nl, /"moneyPayment": "Betaling gelddeel"/);

console.log('validate-counter-payment-path-parity: OK');
