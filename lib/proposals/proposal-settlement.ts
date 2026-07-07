/**
 * Community Order Foundation V2 — settlement helpers for proposals & agreements.
 */
import type { BarterOpenness, PriceModel, SettlementMode } from '@prisma/client';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { hasPublicDisplayPrice } from '@/lib/product/order-method';

export type ProposalSummarySnapshot = {
  settlementMode: SettlementMode;
  amountCents: number | null;
  currency: string;
  acceptedValueTaxonomyIds: string[];
  requestedValueTaxonomyIds: string[];
  title: string;
  quantity: number | null;
  fulfillmentType: string | null;
  paymentPath?: import('./proposal-product-binding').ProposalPaymentPath;
  priceModel?: string | null;
  productId?: string | null;
};

export type AgreementSummarySnapshot = ProposalSummarySnapshot & {
  acceptedById: string;
  acceptedAt: string;
  proposalId: string;
  commitmentAcceptedAt?: string;
  commitmentAcceptedById?: string;
};

const VALID_SETTLEMENT: SettlementMode[] = [
  'MONEY',
  'MONEY_AND_VALUE',
  'VALUE_ONLY',
  'FREE',
  'VOLUNTARY',
];

export function parseSettlementMode(raw: unknown): SettlementMode {
  const key = String(raw ?? 'MONEY').trim().toUpperCase();
  return VALID_SETTLEMENT.includes(key as SettlementMode)
    ? (key as SettlementMode)
    : 'MONEY';
}

export function deriveSettlementModeFromProduct(input: {
  priceCents?: number | null;
  priceModel?: PriceModel | string | null;
  acceptedSpecializations?: string[] | null;
  barterOpenness?: BarterOpenness | null;
}): SettlementMode {
  const hasAccepted =
    (input.acceptedSpecializations?.length ?? 0) > 0;
  const hasMoney = hasPublicDisplayPrice(input);

  if (input.barterOpenness === 'BARTER_ONLY') return 'VALUE_ONLY';
  if (input.barterOpenness === 'MONEY_AND_BARTER' && hasMoney && hasAccepted) {
    return 'MONEY_AND_VALUE';
  }
  if (input.priceModel === 'VOLUNTARY') return 'VOLUNTARY';
  if (input.priceModel === 'ON_REQUEST' && hasAccepted) return 'VALUE_ONLY';
  if (hasMoney && hasAccepted) return 'MONEY_AND_VALUE';
  if (hasAccepted && !hasMoney) return 'VALUE_ONLY';
  if (input.priceModel === 'VOLUNTARY') return 'VOLUNTARY';
  if (!hasMoney) return 'FREE';
  return 'MONEY';
}

export function normalizeProposalTaxonomyIds(raw: unknown): string[] {
  return normalizeAcceptedTaxonomyIds(raw);
}

export function buildProposalSummary(input: {
  settlementMode: SettlementMode;
  amountCents?: number | null;
  currency?: string;
  acceptedValueTaxonomyIds?: string[];
  requestedValueTaxonomyIds?: string[];
  title: string;
  quantity?: number | null;
  fulfillmentType?: string | null;
  paymentPath?: import('./proposal-product-binding').ProposalPaymentPath;
  priceModel?: string | null;
  productId?: string | null;
}): ProposalSummarySnapshot {
  return {
    settlementMode: input.settlementMode,
    amountCents: input.amountCents ?? null,
    currency: input.currency?.trim() || 'EUR',
    acceptedValueTaxonomyIds: input.acceptedValueTaxonomyIds ?? [],
    requestedValueTaxonomyIds: input.requestedValueTaxonomyIds ?? [],
    title: input.title,
    quantity: input.quantity ?? null,
    fulfillmentType: input.fulfillmentType ?? null,
    paymentPath: input.paymentPath ?? 'NONE',
    priceModel: input.priceModel ?? null,
    productId: input.productId ?? null,
  };
}

export function validateProposalSettlement(input: {
  settlementMode: SettlementMode;
  amountCents?: number | null;
  requestedValueTaxonomyIds: string[];
}): { ok: true } | { ok: false; errorKey: string } {
  const { settlementMode, amountCents, requestedValueTaxonomyIds } = input;

  if (settlementMode === 'MONEY') {
    if (amountCents == null || amountCents <= 0) {
      return { ok: false, errorKey: 'proposal.errors.moneyAmountRequired' };
    }
    return { ok: true };
  }

  if (settlementMode === 'VALUE_ONLY') {
    if (requestedValueTaxonomyIds.length === 0) {
      return { ok: false, errorKey: 'proposal.errors.valueRequired' };
    }
    return { ok: true };
  }

  if (settlementMode === 'MONEY_AND_VALUE') {
    if (amountCents == null || amountCents <= 0) {
      return { ok: false, errorKey: 'proposal.errors.moneyAmountRequired' };
    }
    if (requestedValueTaxonomyIds.length === 0) {
      return { ok: false, errorKey: 'proposal.errors.valueRequired' };
    }
    return { ok: true };
  }

  return { ok: true };
}

export function resolveCommunityOrderFulfillment(
  fulfillmentType: string | null | undefined,
): {
  fulfillmentMode: 'PICKUP' | 'DELIVERY' | null;
  deliveryRequested: boolean;
} {
  if (fulfillmentType === 'DELIVERY') {
    return { fulfillmentMode: 'DELIVERY', deliveryRequested: true };
  }
  if (fulfillmentType === 'PICKUP') {
    return { fulfillmentMode: 'PICKUP', deliveryRequested: false };
  }
  return { fulfillmentMode: null, deliveryRequested: false };
}

export function pickProposalNotificationKind(
  event: 'received' | 'accepted',
  settlementMode: SettlementMode,
  hasValueTerms: boolean,
): string {
  if (event === 'received') {
    if (
      hasValueTerms &&
      (settlementMode === 'VALUE_ONLY' ||
        settlementMode === 'MONEY_AND_VALUE')
    ) {
      return 'PROPOSAL_ALTERNATIVE_VALUE';
    }
    return 'PROPOSAL_RECEIVED';
  }
  if (settlementMode === 'MONEY_AND_VALUE') {
    return 'PROPOSAL_MIXED_ACCEPTED';
  }
  return 'PROPOSAL_ACCEPTED';
}
