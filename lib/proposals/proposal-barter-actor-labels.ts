/**
 * Actor-aware labels for proposal barter / value legs.
 *
 * Canonical data (do not invert without a migration plan):
 * - `requestedValueTaxonomyIds` — buyer's barter/value consideration for the
 *   target Product (what the commercial buyer provides). Filled in the form as
 *   “what you offer in return” when the buyer proposes, or “what you ask the
 *   buyer to provide” when the seller counters. Always buyer-side obligation.
 * - `acceptedValueTaxonomyIds` — alternative values the proposer would accept
 *   (often listing accepted-values), not the primary barter offer.
 *
 * Commercial buyer/seller stay stable across counters; `createdById` only
 * identifies whose turn authored this proposal version.
 */

export type ProposalBarterActors = {
  currentUserId: string;
  buyerId: string;
  sellerId: string;
  createdById: string;
};

/** Primary barter leg (requestedValueTaxonomyIds) label key. */
export function resolveBuyerConsiderationLabelKey(
  actors: ProposalBarterActors,
  options?: { asAgreement?: boolean },
): string {
  if (options?.asAgreement) {
    return 'proposal.card.buyerDelivers';
  }

  const { currentUserId, buyerId, sellerId, createdById } = actors;
  const authoredByBuyer = createdById === buyerId;
  const authoredBySeller = createdById === sellerId;
  const viewerIsBuyer = currentUserId === buyerId;
  const viewerIsSeller = currentUserId === sellerId;

  if (authoredByBuyer && viewerIsSeller) {
    return 'proposal.card.buyerOffers';
  }
  if (authoredByBuyer && viewerIsBuyer) {
    return 'proposal.card.youOffer';
  }
  if (authoredBySeller && viewerIsSeller) {
    return 'proposal.card.youAskConsideration';
  }
  if (authoredBySeller && viewerIsBuyer) {
    return 'proposal.card.sellerAsks';
  }

  // Fallback for observers / edge cases — never use ambiguous “asks in return”.
  return authoredByBuyer
    ? 'proposal.card.buyerOffers'
    : 'proposal.card.sellerAsks';
}

/** Photos attached to the barter leg — always buyer consideration. */
export function resolveBuyerConsiderationPhotosLabelKey(
  actors: ProposalBarterActors,
  options?: { asAgreement?: boolean },
): string {
  if (options?.asAgreement) {
    return 'proposal.card.buyerConsiderationPhotos';
  }
  const { currentUserId, buyerId, createdById } = actors;
  if (createdById === buyerId && currentUserId === buyerId) {
    return 'proposal.card.yourConsiderationPhotos';
  }
  return 'proposal.card.buyerConsiderationPhotos';
}

/** Target Product/service the seller provides. */
export function resolveSellerTargetLabelKey(
  options?: { asAgreement?: boolean },
): string {
  return options?.asAgreement
    ? 'proposal.card.sellerDelivers'
    : 'proposal.card.inExchangeFor';
}

/** acceptedValueTaxonomyIds — alternatives, not the primary offer. */
export function resolveAcceptedAlternativesLabelKey(): string {
  return 'proposal.card.acceptedAlternatives';
}

/**
 * Value picker heading while composing.
 * Seller countering asks for buyer consideration; buyer offers it.
 */
export function resolveValuePickerHeadingKey(actors: {
  currentUserId: string;
  buyerId: string;
  sellerId: string;
}): string {
  if (actors.currentUserId === actors.sellerId) {
    return 'marketplace.acceptedValues.askBuyerConsiderationHeading';
  }
  return 'marketplace.acceptedValues.offeredInReturnHeading';
}
