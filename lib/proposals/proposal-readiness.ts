/**
 * Client-side proposal readiness checks — Phase 5E-C.
 * Mirrors server rules where possible; server remains authoritative.
 */

import type { SettlementMode } from '@prisma/client';
import { allowedSettlementModesForBarterOpenness } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import type { ProposalPaymentPath } from './proposal-product-binding';
import { validateProposalSettlement } from './proposal-settlement';
import type { ProposalFormValues } from './proposal-form-types';
import {
  canProposalHomeCheffCheckout,
  parseProposalAmountEurosToCents,
} from './proposal-homecheff-eligibility';

export type ProposalProductContext = {
  id: string;
  barterOpenness: string | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  /** Seller Connect + HC opt-in (amount checked separately for HC path). */
  canHomeCheffCheckout: boolean;
  sellerStripeReady?: boolean;
  isActive?: boolean;
};

export type ProposalReadinessInput = {
  form: ProposalFormValues;
  product?: ProposalProductContext | null;
  isAuthenticated: boolean;
};

export type ProposalReadinessResult =
  | { ok: true }
  | { ok: false; errorKey: string };

export function validateProposalReadiness(
  input: ProposalReadinessInput,
): ProposalReadinessResult {
  if (!input.isAuthenticated) {
    return { ok: false, errorKey: 'proposal.errors.authRequired' };
  }

  const title = input.form.title.trim();
  if (!title) {
    return { ok: false, errorKey: 'marketplace.errors.titleDescriptionRequired' };
  }

  const { form, product } = input;
  const showMoney =
    form.settlementMode === 'MONEY' || form.settlementMode === 'MONEY_AND_VALUE';
  const requestedValueTaxonomyIds = normalizeAcceptedTaxonomyIds(
    form.requestedValueTaxonomyIds,
  );
  const acceptedValueTaxonomyIds = normalizeAcceptedTaxonomyIds(
    form.acceptedValueTaxonomyIds,
  );

  const amountCents = showMoney
    ? parseProposalAmountEurosToCents(form.amountEuros)
    : null;

  const settlementCheck = validateProposalSettlement({
    settlementMode: form.settlementMode,
    amountCents,
    requestedValueTaxonomyIds,
  });
  if (!settlementCheck.ok) return settlementCheck;

  if (product) {
    if (product.isActive === false) {
      return { ok: false, errorKey: 'proposal.errors.listingInactive' };
    }

    const allowed = allowedSettlementModesForBarterOpenness(product.barterOpenness);
    if (!allowed.includes(form.settlementMode)) {
      return { ok: false, errorKey: 'proposal.errors.settlementNotAllowed' };
    }

    const qty = form.quantity.trim() ? parseInt(form.quantity, 10) : undefined;
    if (
      product.availableStock != null &&
      qty != null &&
      Number.isFinite(qty) &&
      qty > product.availableStock
    ) {
      return {
        ok: false,
        errorKey: 'proposal.productBinding.exceedsStock',
      };
    }
    if (product.availableStock != null && product.availableStock <= 0) {
      return { ok: false, errorKey: 'proposal.productBinding.outOfStock' };
    }

    if (showMoney && form.paymentPath === 'HOMECHEFF_CHECKOUT') {
      const sellerStripeReady =
        product.sellerStripeReady ?? product.canHomeCheffCheckout;
      if (
        !canProposalHomeCheffCheckout({
          acceptHomeCheffPayment: product.acceptHomeCheffPayment,
          sellerStripeReady,
          settlementMode: form.settlementMode,
          amountCents,
        })
      ) {
        return { ok: false, errorKey: 'proposal.errors.checkoutNotAvailable' };
      }
    }
  }

  if (
    acceptedValueTaxonomyIds.length > 0 &&
    acceptedValueTaxonomyIds.length !== form.acceptedValueTaxonomyIds.length
  ) {
    return { ok: false, errorKey: 'proposal.errors.invalidAcceptedValues' };
  }

  if (
    requestedValueTaxonomyIds.length > 0 &&
    requestedValueTaxonomyIds.length !== form.requestedValueTaxonomyIds.length
  ) {
    return { ok: false, errorKey: 'proposal.errors.invalidRequestedValues' };
  }

  return { ok: true };
}

export function formValuesToApiPayload(form: ProposalFormValues, options: {
  productId?: string | null;
  showPaymentPath: boolean;
}) {
  const showMoney =
    form.settlementMode === 'MONEY' || form.settlementMode === 'MONEY_AND_VALUE';
  const showValue =
    form.settlementMode === 'VALUE_ONLY' ||
    form.settlementMode === 'MONEY_AND_VALUE';

  const quantity = form.quantity.trim() ? parseInt(form.quantity, 10) : undefined;
  const amountCents = showMoney
    ? parseProposalAmountEurosToCents(form.amountEuros)
    : null;

  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    quantity: Number.isFinite(quantity!) ? quantity : null,
    amountCents,
    requestedDate: form.requestedDate || null,
    requestedTimeWindow: form.requestedTimeWindow.trim() || null,
    fulfillmentType: form.fulfillmentType || null,
    productId: options.productId ?? null,
    settlementMode: form.settlementMode,
    paymentPath: options.showPaymentPath ? form.paymentPath : ('NONE' as ProposalPaymentPath),
    acceptedValueTaxonomyIds: form.acceptedValueTaxonomyIds,
    requestedValueTaxonomyIds: showValue ? form.requestedValueTaxonomyIds : [],
  };
}
