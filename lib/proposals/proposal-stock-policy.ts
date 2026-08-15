/**
 * Proposal negotiation vs direct-purchase stock policy.
 *
 * FIXED cart purchase stays strict elsewhere.
 * ON_REQUEST / services / digital work: stock=0 must not block negotiation
 * or negotiated HomeCheff checkout. Direct FIXED inventory stays enforced.
 */

export type ProposalStockPolicyInput = {
  priceModel?: string | null;
  marketplaceCategory?: string | null;
  fulfillmentOptions?: { digital?: boolean | null } | null;
};

/**
 * When true, availableStock=0 does not block creating/accepting a proposal.
 * Seller still accept/counter/reject; listing inactive remains a separate gate.
 */
export function proposalNegotiationIgnoresStockAvailability(
  input: ProposalStockPolicyInput,
): boolean {
  const model = String(input.priceModel ?? '').trim().toUpperCase();
  if (
    model === 'ON_REQUEST' ||
    model === 'VOLUNTARY' ||
    model === 'HOURLY' ||
    model === 'DAILY'
  ) {
    return true;
  }

  const category = String(input.marketplaceCategory ?? '')
    .trim()
    .toUpperCase();
  if (
    category === 'ARTISTIC_SERVICE' ||
    category === 'PRACTICAL_SERVICE' ||
    category === 'KNOWLEDGE' ||
    category === 'DESIGN'
  ) {
    return true;
  }

  if (input.fulfillmentOptions?.digital === true) {
    return true;
  }

  return false;
}

/**
 * Physical FIXED (and other non-exempt) listings must enforce stock at checkout.
 * Negotiated ON_REQUEST / service / digital entitlements do not use Product stock
 * as a payment gate — and must not decrement stock on capture.
 */
export function requiresInventoryForCheckout(
  input: ProposalStockPolicyInput,
): boolean {
  return !proposalNegotiationIgnoresStockAvailability(input);
}

export function validateProposalQuantityAgainstStock(
  availableStock: number | null,
  quantity: number | null | undefined,
  policy?: ProposalStockPolicyInput & { ignoreStockAvailability?: boolean },
): { ok: true } | { ok: false; errorKey: string; available?: number } {
  const qty = quantity ?? 1;
  if (qty < 1) {
    return { ok: false, errorKey: 'proposal.errors.quantityRequired' };
  }

  const ignore =
    policy?.ignoreStockAvailability === true ||
    (policy != null && proposalNegotiationIgnoresStockAvailability(policy));

  if (ignore || availableStock == null) return { ok: true };

  if (availableStock <= 0) {
    return {
      ok: false,
      errorKey: 'proposal.productBinding.outOfStock',
      available: 0,
    };
  }
  if (qty > availableStock) {
    return {
      ok: false,
      errorKey: 'proposal.productBinding.exceedsStock',
      available: availableStock,
    };
  }
  return { ok: true };
}
