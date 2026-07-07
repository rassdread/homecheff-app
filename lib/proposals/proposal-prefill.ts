/**
 * Proposal prefill engine — Phase 5E-C.
 * Uses only existing listing / suggestion / proposal data — no guessing.
 */

import type { SettlementMode } from '@prisma/client';
import { allowedSettlementModesForBarterOpenness } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import { deriveSettlementModeFromProduct } from './proposal-settlement';
import type { ProposalFormValues } from './proposal-form-types';
import { paymentPathFromSummary } from './proposal-accept-routing';
import type { ProposalDTO } from './proposal-types';
import type { ResolvedConversationHeader } from '@/lib/communication/resolveConversationHeader';
import { allowedFulfillmentTypes } from './proposal-fulfillment-utils';

export type ProposalPrefillSource =
  | 'listing'
  | 'exchange_suggestion'
  | 'counter'
  | 'conversation';

export type ProposalPrefillExchangeSuggestion = {
  sourceListingId: string;
  counterpartyListingId: string;
  counterpartyUserId: string;
  counterpartyTitle: string;
  overlapTaxonomyIds: string[];
  suggestionType: string;
};

export type ProposalPrefillInput = {
  source: ProposalPrefillSource;
  contextHeader?: ResolvedConversationHeader | null;
  exchangeSuggestion?: ProposalPrefillExchangeSuggestion;
  parentProposal?: ProposalDTO;
};

export type ProposalPrefillMeta = {
  source: ProposalPrefillSource;
  exchangeSuggestionUsed: boolean;
  taxonomyOverlapCount: number;
  listingId: string | null;
  sourceListingId: string | null;
};

export type ProposalPrefillResult = {
  form: ProposalFormValues;
  meta: ProposalPrefillMeta;
};

function baseFromHeader(
  contextHeader?: ResolvedConversationHeader | null,
): ProposalFormValues {
  const base: ProposalFormValues = {
    title: '',
    description: '',
    quantity: '1',
    amountEuros: '',
    requestedDate: '',
    requestedTimeWindow: '',
    fulfillmentType: '',
    settlementMode: 'MONEY',
    paymentPath: 'NONE',
    acceptedValueTaxonomyIds: [],
    requestedValueTaxonomyIds: [],
  };

  if (contextHeader?.kind !== 'PRODUCT') return base;

  const product = contextHeader.product;
  const allowed = allowedFulfillmentTypes(product.fulfillmentOptions);
  const defaultFulfillment =
    product.delivery === 'DELIVERY' && allowed.includes('DELIVERY')
      ? 'DELIVERY'
      : allowed.includes('PICKUP')
        ? 'PICKUP'
        : allowed[0] ?? '';

  let settlementMode = deriveSettlementModeFromProduct({
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    acceptedSpecializations: product.acceptedSpecializations,
    barterOpenness: product.barterOpenness as import('@prisma/client').BarterOpenness | null,
  });

  const allowedModes = allowedSettlementModesForBarterOpenness(product.barterOpenness);
  if (!allowedModes.includes(settlementMode)) {
    settlementMode = allowedModes[0] ?? 'MONEY';
  }

  return {
    ...base,
    title: product.title,
    amountEuros: product.priceCents ? String(product.priceCents / 100) : '',
    fulfillmentType: defaultFulfillment,
    settlementMode,
    paymentPath: product.defaultPaymentPath,
    acceptedValueTaxonomyIds: [...product.acceptedSpecializations],
  };
}

function fromParentProposal(proposal: ProposalDTO): ProposalFormValues {
  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);
  return {
    title: proposal.title,
    description: proposal.description ?? '',
    quantity: proposal.quantity != null ? String(proposal.quantity) : '1',
    amountEuros:
      proposal.amountCents != null && proposal.amountCents > 0
        ? String(proposal.amountCents / 100)
        : '',
    requestedDate: proposal.requestedDate
      ? proposal.requestedDate.slice(0, 10)
      : '',
    requestedTimeWindow: proposal.requestedTimeWindow ?? '',
    fulfillmentType: proposal.fulfillmentType ?? '',
    settlementMode: proposal.settlementMode,
    paymentPath,
    acceptedValueTaxonomyIds: [...proposal.acceptedValueTaxonomyIds],
    requestedValueTaxonomyIds: [...proposal.requestedValueTaxonomyIds],
  };
}

function applyExchangeSuggestion(
  form: ProposalFormValues,
  suggestion: ProposalPrefillExchangeSuggestion,
): ProposalFormValues {
  const overlap = suggestion.overlapTaxonomyIds.filter(Boolean);
  const next: ProposalFormValues = {
    ...form,
    title: form.title || suggestion.counterpartyTitle,
  };

  if (overlap.length > 0) {
    next.requestedValueTaxonomyIds = [
      ...new Set([...next.requestedValueTaxonomyIds, ...overlap]),
    ];
    if (next.settlementMode === 'MONEY') {
      next.settlementMode = 'MONEY_AND_VALUE';
    }
  }

  return next;
}

export function resolveProposalPrefill(input: ProposalPrefillInput): ProposalPrefillResult {
  let source: ProposalPrefillSource = input.source;
  let form: ProposalFormValues;

  if (input.parentProposal) {
    source = 'counter';
    form = fromParentProposal(input.parentProposal);
  } else {
    form = baseFromHeader(input.contextHeader);
    if (input.source === 'listing' || input.source === 'conversation') {
      source = input.contextHeader?.kind === 'PRODUCT' ? 'listing' : 'conversation';
    }
  }

  let exchangeSuggestionUsed = false;
  let taxonomyOverlapCount = 0;
  let sourceListingId: string | null = null;

  if (input.exchangeSuggestion) {
    source = 'exchange_suggestion';
    exchangeSuggestionUsed = true;
    taxonomyOverlapCount = input.exchangeSuggestion.overlapTaxonomyIds.length;
    sourceListingId = input.exchangeSuggestion.sourceListingId;
    form = applyExchangeSuggestion(form, input.exchangeSuggestion);
  }

  const listingId =
    input.contextHeader?.kind === 'PRODUCT'
      ? input.contextHeader.product.id
      : input.exchangeSuggestion?.counterpartyListingId ??
        input.parentProposal?.productId ??
        null;

  return {
    form,
    meta: {
      source,
      exchangeSuggestionUsed,
      taxonomyOverlapCount,
      listingId,
      sourceListingId,
    },
  };
}

export function proposalPrefillFromSuggestionCard(card: {
  sourceListingId: string;
  counterpartyListingId: string;
  counterpartyUserId: string;
  counterpartyTitle: string;
  overlapTaxonomyIds: string[];
  suggestionType: string;
}): ProposalPrefillExchangeSuggestion {
  return {
    sourceListingId: card.sourceListingId,
    counterpartyListingId: card.counterpartyListingId,
    counterpartyUserId: card.counterpartyUserId,
    counterpartyTitle: card.counterpartyTitle,
    overlapTaxonomyIds: card.overlapTaxonomyIds,
    suggestionType: card.suggestionType,
  };
}
