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

export type ProposalProductContext = {
  id: string;
  barterOpenness: string | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  canHomeCheffCheckout: boolean;
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

function parseAmountCents(amountEuros: string, showMoney: boolean): number | null {
  if (!showMoney) return null;
  const euros = amountEuros.trim()
    ? parseFloat(amountEuros.replace(',', '.'))
    : undefined;
  if (euros == null || !Number.isFinite(euros)) return null;
  return Math.round(euros * 100);
}

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

  const amountCents = parseAmountCents(form.amountEuros, showMoney);

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

    if (showMoney && form.paymentPath === 'HOMECHEFF_CHECKOUT' && !product.canHomeCheffCheckout) {
      return { ok: false, errorKey: 'proposal.errors.checkoutNotAvailable' };
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
  const euros = form.amountEuros.trim()
    ? parseFloat(form.amountEuros.replace(',', '.'))
    : undefined;
  const amountCents =
    showMoney && euros != null && Number.isFinite(euros)
      ? Math.round(euros * 100)
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
