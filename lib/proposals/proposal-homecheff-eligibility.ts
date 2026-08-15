/**
 * Proposal vs listing HomeCheff Checkout eligibility.
 *
 * LISTING / CART checkout may still require a public listing price > 0.
 * Negotiated proposals must use proposal.amountCents > 0 — not listing.priceCents.
 */
import {
  sellerPaymentsReady,
  type SellerPaymentsUser,
} from '@/lib/product/order-method';

export type ProposalHomeCheffEligibilityInput = {
  acceptHomeCheffPayment: boolean;
  sellerStripeReady: boolean;
  settlementMode: string;
  /** Negotiated proposal money in cents; listing price is intentionally ignored. */
  amountCents: number | null | undefined;
};

export type ProposalHomeCheffBlockedReason =
  | 'proposal.productBinding.checkoutNotApplicable'
  | 'proposal.productBinding.checkoutNotAllowed'
  | 'proposal.productBinding.paymentsRequired'
  | 'proposal.productBinding.amountRequiredForCheckout'
  | null;

function hasMoneySettlementLeg(settlementMode: string): boolean {
  return settlementMode === 'MONEY' || settlementMode === 'MONEY_AND_VALUE';
}

/** Valid positive negotiated money for HomeCheff proposal checkout. */
export function isValidProposalCheckoutAmountCents(
  amountCents: number | null | undefined,
): amountCents is number {
  return (
    typeof amountCents === 'number' &&
    Number.isFinite(amountCents) &&
    Number.isInteger(amountCents) &&
    amountCents > 0
  );
}

/**
 * Parse euros form field → cents. Rejects empty, NaN, negative, non-finite.
 * Allows decimal euros (e.g. 25,50 → 2550).
 */
export function parseProposalAmountEurosToCents(
  amountEuros: string,
): number | null {
  const trimmed = amountEuros.trim();
  if (!trimmed) return null;
  const euros = parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(euros) || euros < 0) return null;
  const cents = Math.round(euros * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

/** Seller Connect readiness for proposal checkout (reuse canonical helper). */
export function isSellerStripeReadyForProposal(
  user: SellerPaymentsUser | null | undefined,
): boolean {
  return sellerPaymentsReady(user);
}

/**
 * Seller opted into HomeCheff + Connect ready — amount not yet considered.
 * Use for UI base eligibility (button visible; enable when amount > 0).
 */
export function isSellerEligibleForProposalHomeCheff(input: {
  acceptHomeCheffPayment: boolean;
  sellerStripeReady: boolean;
}): boolean {
  return Boolean(input.acceptHomeCheffPayment && input.sellerStripeReady);
}

/**
 * Full proposal HomeCheff Checkout eligibility for a money leg.
 * Does NOT require listing.priceCents > 0.
 */
export function canProposalHomeCheffCheckout(
  input: ProposalHomeCheffEligibilityInput,
): boolean {
  return proposalHomeCheffCheckoutBlockedReason(input) === null;
}

export function proposalHomeCheffCheckoutBlockedReason(
  input: ProposalHomeCheffEligibilityInput,
): ProposalHomeCheffBlockedReason {
  if (!hasMoneySettlementLeg(input.settlementMode)) {
    return 'proposal.productBinding.checkoutNotApplicable';
  }
  if (!input.acceptHomeCheffPayment) {
    return 'proposal.productBinding.checkoutNotAllowed';
  }
  if (!input.sellerStripeReady) {
    return 'proposal.productBinding.paymentsRequired';
  }
  if (!isValidProposalCheckoutAmountCents(input.amountCents)) {
    return 'proposal.productBinding.amountRequiredForCheckout';
  }
  return null;
}
