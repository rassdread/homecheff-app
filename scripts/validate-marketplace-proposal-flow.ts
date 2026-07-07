#!/usr/bin/env npx tsx
/**
 * Phase 5E-C proposal polish + exchange-to-proposal flow validation.
 * Run: npx tsx scripts/validate-marketplace-proposal-flow.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ConversationHeaderProduct,
  ResolvedConversationHeader,
} from '../lib/communication/resolveConversationHeader';
import { allowedSettlementModesForBarterOpenness } from '../lib/marketplace/commerce/barter-commerce-alignment';
import { PROPOSAL_POLISH_I18N } from '../lib/proposals/proposal-i18n-keys';
import {
  PROPOSAL_FLOW_EVENTS,
  trackProposalFlowEvent,
} from '../lib/proposals/proposal-analytics';
import { EMPTY_PROPOSAL_FORM } from '../lib/proposals/proposal-form-types';
import {
  formValuesToApiPayload,
  validateProposalReadiness,
} from '../lib/proposals/proposal-readiness';
import {
  proposalPrefillFromSuggestionCard,
  resolveProposalPrefill,
} from '../lib/proposals/proposal-prefill';
import type { ProposalDTO } from '../lib/proposals/proposal-types';
import { validateProposalSettlement } from '../lib/proposals/proposal-settlement';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function dig(obj: Record<string, unknown>, parts: string[]): unknown {
  return parts.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function productHeader(overrides: Partial<ConversationHeaderProduct> = {}): ResolvedConversationHeader {
  return {
    kind: 'PRODUCT',
    product: {
      id: 'listing-1',
      title: 'Portret schilderen',
      priceCents: 2500,
      priceModel: 'FIXED',
      category: null,
      marketplaceCategory: 'CREATE',
      delivery: 'PICKUP',
      imageUrl: null,
      href: '/product/portret',
      canCheckout: true,
      acceptedSpecializations: ['create.art'],
      barterOpenness: 'MONEY_AND_BARTER',
      stock: 5,
      maxStock: null,
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      homeCheffCheckoutBlockedReason: null,
      fulfillmentOptions: { pickup: true, delivery: true, digital: false },
      defaultPaymentPath: 'HOMECHEFF_CHECKOUT',
      ...overrides,
    },
  };
}

function baseProposal(overrides: Partial<ProposalDTO> = {}): ProposalDTO {
  return {
    id: 'prop-1',
    conversationId: 'conv-1',
    createdById: 'buyer-1',
    sellerId: 'seller-1',
    buyerId: 'buyer-1',
    productId: 'listing-1',
    listingId: 'listing-1',
    title: 'Portret schilderen',
    description: 'In overleg',
    quantity: 1,
    amountCents: 2500,
    currency: 'EUR',
    requestedDate: null,
    requestedTimeWindow: null,
    fulfillmentType: 'PICKUP',
    category: 'PRODUCT',
    settlementMode: 'MONEY',
    acceptedValueTaxonomyIds: ['create.art'],
    requestedValueTaxonomyIds: [],
    proposalSummary: {
      settlementMode: 'MONEY',
      amountCents: 2500,
      currency: 'EUR',
      acceptedValueTaxonomyIds: ['create.art'],
      requestedValueTaxonomyIds: [],
      title: 'Portret schilderen',
      quantity: 1,
      fulfillmentType: 'PICKUP',
      paymentPath: 'HOMECHEFF_CHECKOUT',
      priceModel: 'FIXED',
      productId: 'listing-1',
    },
    status: 'PENDING',
    parentProposalId: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

console.log('=== Marketplace Proposal Flow (Phase 5E-C) ===\n');

console.log('Prefill engine');
const listingPrefill = resolveProposalPrefill({
  source: 'listing',
  contextHeader: productHeader(),
});
assert(listingPrefill.meta.source === 'listing', 'listing prefill source');
assert(listingPrefill.form.title === 'Portret schilderen', 'listing prefill title from product');
assert(
  listingPrefill.form.settlementMode === 'MONEY_AND_VALUE',
  'MONEY_AND_BARTER listing → MONEY_AND_VALUE default',
);

const suggestionCard = {
  id: 'sug-1',
  sourceListingId: 'listing-src',
  counterpartyListingId: 'listing-2',
  counterpartyUserId: 'user-2',
  counterpartyTitle: 'Surinaamse maaltijd',
  overlapTaxonomyIds: ['create.meal', 'create.food'],
  suggestionType: 'OUTBOUND_MATCH',
};
const exchangePrefill = resolveProposalPrefill({
  source: 'exchange_suggestion',
  contextHeader: productHeader({ id: 'listing-2', title: 'Surinaamse maaltijd' }),
  exchangeSuggestion: proposalPrefillFromSuggestionCard(suggestionCard),
});
assert(exchangePrefill.meta.exchangeSuggestionUsed === true, 'exchange suggestion flagged');
assert(exchangePrefill.meta.taxonomyOverlapCount === 2, 'taxonomy overlap count');
assert(
  exchangePrefill.form.requestedValueTaxonomyIds.includes('create.meal'),
  'overlap taxonomy applied to requested values',
);

const counterPrefill = resolveProposalPrefill({
  source: 'counter',
  parentProposal: baseProposal({
    settlementMode: 'MONEY_AND_VALUE',
    requestedValueTaxonomyIds: ['create.meal'],
    amountCents: 2000,
  }),
});
assert(counterPrefill.meta.source === 'counter', 'counter prefill source');
assert(counterPrefill.form.settlementMode === 'MONEY_AND_VALUE', 'counter inherits settlement');
assert(counterPrefill.form.requestedValueTaxonomyIds.includes('create.meal'), 'counter inherits requested values');

console.log('\nScenario 1 — Listing → proposal → accept → deal');
const moneyForm = {
  ...listingPrefill.form,
  title: 'Portret',
  amountEuros: '25',
  settlementMode: 'MONEY' as const,
  paymentPath: 'HOMECHEFF_CHECKOUT' as const,
};
assert(
  validateProposalReadiness({
    form: moneyForm,
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === true,
  'money listing proposal passes readiness',
);
const createRoute = readRepoFile('app/api/conversations/[conversationId]/proposals/route.ts');
const acceptRoute = readRepoFile('app/api/proposals/[proposalId]/accept/route.ts');
assert(createRoute.includes('POST'), 'create proposal API exists');
assert(acceptRoute.includes('commitmentAccepted'), 'accept route supports deal commitment');

console.log('\nScenario 2 — Listing → proposal → counter → accept');
const counterForm = counterPrefill.form;
assert(
  validateProposalReadiness({ form: { ...counterForm, title: 'Tegenvoorstel', amountEuros: '20' }, isAuthenticated: true }).ok === true,
  'counter form passes settlement validation',
);
const counterRoute = readRepoFile('app/api/proposals/[proposalId]/counter/route.ts');
const counterUi = readRepoFile('components/chat/proposals/CounterProposalForm.tsx');
assert(counterRoute.includes('POST'), 'counter API exists');
assert(counterUi.includes('ProposalFieldsSection'), 'counter uses full ProposalFieldsSection');
assert(counterUi.includes('ProposalSummaryPreview'), 'counter shows summary preview');
assert(counterUi.includes('settlementMode'), 'counter edits settlement mode');

console.log('\nScenario 3 — Exchange suggestion → proposal → deal');
const startChat = readRepoFile('components/chat/StartChatButton.tsx');
const suggestionCardUi = readRepoFile(
  'components/marketplace/exchange-suggestions/ExchangeSuggestionCard.tsx',
);
assert(startChat.includes('storeProposalPrefill'), 'StartChatButton stores session prefill');
assert(startChat.includes('openProposalAfterStart'), 'StartChatButton opens proposal sheet');
assert(suggestionCardUi.includes('start_proposal'), 'exchange card has start_proposal CTA');
assert(suggestionCardUi.includes('proposalPrefillFromSuggestionCard'), 'exchange card builds prefill');

console.log('\nScenario 4 — Barter only');
const barterHeader = productHeader({
  priceCents: 0,
  priceModel: 'ON_REQUEST',
  barterOpenness: 'BARTER_ONLY',
  acceptedSpecializations: ['create.meal'],
  defaultPaymentPath: 'NONE',
  canHomeCheffCheckout: false,
});
const barterPrefill = resolveProposalPrefill({ source: 'listing', contextHeader: barterHeader });
assert(barterPrefill.form.settlementMode === 'VALUE_ONLY', 'BARTER_ONLY → VALUE_ONLY prefill');
const barterForm = {
  ...barterPrefill.form,
  title: 'Ruil maaltijd',
  requestedValueTaxonomyIds: ['create.art'],
};
assert(
  validateProposalReadiness({
    form: barterForm,
    product: {
      id: 'listing-barter',
      barterOpenness: 'BARTER_ONLY',
      availableStock: null,
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      canHomeCheffCheckout: false,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === true,
  'barter-only proposal passes readiness',
);
assert(
  !allowedSettlementModesForBarterOpenness('BARTER_ONLY').includes('MONEY'),
  'barter listing disallows MONEY settlement mode',
);

console.log('\nScenario 5 — Money and barter');
const hybridForm = {
  ...EMPTY_PROPOSAL_FORM,
  title: 'Portret + ruil',
  amountEuros: '15',
  settlementMode: 'MONEY_AND_VALUE' as const,
  acceptedValueTaxonomyIds: ['create.art'],
  requestedValueTaxonomyIds: ['create.meal'],
  paymentPath: 'HOMECHEFF_CHECKOUT' as const,
};
assert(
  validateProposalSettlement({
    settlementMode: 'MONEY_AND_VALUE',
    amountCents: 1500,
    requestedValueTaxonomyIds: ['create.meal'],
  }).ok === true,
  'MONEY_AND_VALUE settlement valid with amount + values',
);
assert(
  validateProposalReadiness({
    form: hybridForm,
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY_AND_BARTER',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === true,
  'hybrid proposal passes readiness',
);

console.log('\nScenario 6 — Delivery required');
const deliveryForm = {
  ...moneyForm,
  fulfillmentType: 'DELIVERY' as const,
};
const deliveryPayload = formValuesToApiPayload(deliveryForm, {
  productId: 'listing-1',
  showPaymentPath: true,
});
assert(deliveryPayload.fulfillmentType === 'DELIVERY', 'delivery fulfillment in API payload');

console.log('\nScenario 7 — Direct contact');
const directForm = {
  ...moneyForm,
  paymentPath: 'DIRECT_CONTACT' as const,
};
assert(
  validateProposalReadiness({
    form: directForm,
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === true,
  'direct contact payment path passes readiness',
);
const directPayload = formValuesToApiPayload(directForm, {
  productId: 'listing-1',
  showPaymentPath: true,
});
assert(directPayload.paymentPath === 'DIRECT_CONTACT', 'direct contact in payload');

console.log('\nScenario 8 — HomeCheff checkout');
assert(
  validateProposalReadiness({
    form: moneyForm,
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: false,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === false,
  'checkout blocked when canHomeCheffCheckout false',
);
const checkoutPayload = formValuesToApiPayload(moneyForm, {
  productId: 'listing-1',
  showPaymentPath: true,
});
assert(checkoutPayload.paymentPath === 'HOMECHEFF_CHECKOUT', 'HomeCheff checkout in payload');

console.log('\nReadiness guards');
assert(
  validateProposalReadiness({ form: moneyForm, isAuthenticated: false }).ok === false,
  'unauthenticated blocked',
);
assert(
  validateProposalReadiness({
    form: moneyForm,
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      isActive: false,
    },
    isAuthenticated: true,
  }).ok === false,
  'inactive listing blocked',
);
assert(
  validateProposalReadiness({
    form: { ...moneyForm, settlementMode: 'VALUE_ONLY', requestedValueTaxonomyIds: ['create.meal'] },
    product: {
      id: 'listing-1',
      barterOpenness: 'MONEY',
      availableStock: 5,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      canHomeCheffCheckout: true,
      isActive: true,
    },
    isAuthenticated: true,
  }).ok === false,
  'settlement incompatible with barter openness blocked',
);

console.log('\nAnalytics events');
assert(PROPOSAL_FLOW_EVENTS.opened === 'proposal_opened', 'proposal_opened event');
assert(PROPOSAL_FLOW_EVENTS.prefilled === 'proposal_prefilled', 'proposal_prefilled event');
assert(PROPOSAL_FLOW_EVENTS.countered === 'proposal_countered', 'proposal_countered event');
assert(PROPOSAL_FLOW_EVENTS.sent === 'proposal_sent', 'proposal_sent event');
assert(PROPOSAL_FLOW_EVENTS.accepted === 'proposal_accepted', 'proposal_accepted event');
assert(PROPOSAL_FLOW_EVENTS.rejected === 'proposal_rejected', 'proposal_rejected event');
assert(typeof trackProposalFlowEvent === 'function', 'trackProposalFlowEvent exported');

const createSheet = readRepoFile('components/chat/proposals/CreateProposalSheet.tsx');
const proposalCard = readRepoFile('components/chat/proposals/ProposalCard.tsx');
assert(createSheet.includes('trackProposalFlowEvent'), 'CreateProposalSheet tracks analytics');
assert(createSheet.includes('ProposalSummaryPreview'), 'CreateProposalSheet shows summary');
assert(proposalCard.includes('trackProposalFlowEvent'), 'ProposalCard tracks accept/reject');

console.log('\ni18n parity');
const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const en = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/en.json'), 'utf8'),
) as Record<string, unknown>;

const i18nPaths = [
  ['marketplace', 'proposals', 'summary', 'heading'],
  ['marketplace', 'proposals', 'summary', 'offer'],
  ['marketplace', 'proposals', 'counter', 'heading'],
  ['marketplace', 'proposals', 'prefill', 'fromExchange'],
  ['marketplace', 'exchangeSuggestions', 'ctas', 'startProposal'],
  ['proposal', 'errors', 'authRequired'],
  ['proposal', 'errors', 'listingInactive'],
  ['proposal', 'errors', 'settlementNotAllowed'],
  ['proposal', 'errors', 'checkoutNotAvailable'],
];

for (const locale of ['nl', 'en'] as const) {
  const data = locale === 'nl' ? nl : en;
  for (const parts of i18nPaths) {
    assert(typeof dig(data, parts) === 'string', `${locale}: ${parts.join('.')}`);
  }
}

const i18nKeys = readRepoFile('lib/proposals/proposal-i18n-keys.ts');
assert(i18nKeys.includes('PROPOSAL_POLISH_I18N'), 'PROPOSAL_POLISH_I18N exported');
assert(
  i18nKeys.includes(PROPOSAL_POLISH_I18N.summary.heading),
  'summary heading key registered',
);

console.log('\nDocumentation');
assert(
  fs.existsSync(path.join(process.cwd(), 'docs/progress/MARKETPLACE_PHASE5E_C_PROPOSAL_POLISH.md')),
  'progress doc exists',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'docs/audits/MARKETPLACE_PROPOSAL_FLOW_AUDIT.md')),
  'audit doc exists',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
