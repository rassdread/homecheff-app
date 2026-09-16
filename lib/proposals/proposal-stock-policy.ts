/**
 * Proposal negotiation vs direct-purchase stock policy.
 *
 * FIXED cart purchase stays strict elsewhere.
 * ON_REQUEST / services / digital work: stock=0 must not block negotiation
 * or negotiated HomeCheff checkout. Direct FIXED inventory stays enforced.
 */

import { listingUsesPhysicalInventory, type ListingInventoryInput } from '@/lib/products/listing-inventory';

export type ProposalStockPolicyInput = {
  priceModel?: string | null;
  marketplaceCategory?: string | null;
  productCategory?: string | null;
  fulfillmentOptions?: ListingInventoryInput['fulfillmentOptions'];
  specializations?: string[] | null;
  listingIntent?: string | null;
};

/**
 * When true, availableStock=0 does not block creating/accepting a proposal.
 * Seller still accept/counter/reject; listing inactive remains a separate gate.
 */
export function proposalNegotiationIgnoresStockAvailability(
  input: ProposalStockPolicyInput,
): boolean {
  return !listingUsesPhysicalInventory(input);
}

/**
 * Physical FIXED (and other non-exempt) listings must enforce stock at checkout.
 * Negotiated ON_REQUEST / service / digital entitlements do not use Product stock
 * as a payment gate — and must not decrement stock on capture.
 */
export function requiresInventoryForCheckout(
  input: ProposalStockPolicyInput,
): boolean {
  return listingUsesPhysicalInventory(input);
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
