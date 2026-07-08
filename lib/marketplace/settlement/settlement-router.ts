/**
 * Central settlement router — Phase 7C.10 (core business rule).
 *
 * The CHOSEN settlement option determines the user flow — NOT the category,
 * listingKind, listingIntent, priceModel, barterOpenness or orderMethod.
 *
 *   HomeCheff Checkout                     → CHECKOUT  (existing Stripe flow)
 *   Direct contact / Cash / Barter / Value → PROPOSAL  (chat → voorstel → deal)
 *
 * This holds for Gezocht (REQUEST) too: a request that offers HomeCheff Checkout
 * routes to checkout; direct/barter/value routes to proposal.
 *
 * Every entrypoint (tile, preview, detail, profile, favorites, search, Gezocht,
 * Diensten, Buurthulp) MUST use this single helper — no per-page routing.
 */

import type { SettlementOptions } from './settlement-options';

export type SettlementMethod =
  | 'HOMECHEFF_CHECKOUT'
  | 'DIRECT_CONTACT'
  | 'BARTER'
  | 'ACCEPTED_VALUE';

export type SettlementFlow = 'CHECKOUT' | 'PROPOSAL';

/**
 * THE business rule: only HomeCheff Checkout goes to checkout; everything else
 * goes to proposal/conversation.
 */
export function resolveSettlementFlow(method: SettlementMethod): SettlementFlow {
  return method === 'HOMECHEFF_CHECKOUT' ? 'CHECKOUT' : 'PROPOSAL';
}

export type SettlementFlowAvailability = {
  /** HomeCheff Checkout is publicly available now (Connect ready + selected). */
  checkout: boolean;
  /** A proposal/conversation flow is available. */
  proposal: boolean;
  /** Methods that route to CHECKOUT. */
  checkoutMethods: SettlementMethod[];
  /** Methods that route to PROPOSAL. */
  proposalMethods: SettlementMethod[];
  /**
   * Preferred flow when the surface must pick one default CTA. Checkout wins
   * only when it is truly available; otherwise proposal.
   */
  primaryFlow: SettlementFlow;
};

/**
 * Map canonical settlement options → available flows. Presentation surfaces use
 * this to decide which CTA(s) to render, consistently everywhere.
 */
export function resolveSettlementFlowAvailability(
  options: SettlementOptions,
): SettlementFlowAvailability {
  const checkoutMethods: SettlementMethod[] = [];
  const proposalMethods: SettlementMethod[] = [];

  if (options.canCheckoutNow) checkoutMethods.push('HOMECHEFF_CHECKOUT');
  if (options.acceptsDirectContact) proposalMethods.push('DIRECT_CONTACT');
  if (options.allowsBarter) proposalMethods.push('BARTER');
  if (options.hasAcceptedValues) proposalMethods.push('ACCEPTED_VALUE');

  const checkout = checkoutMethods.length > 0;
  const proposal = proposalMethods.length > 0 || options.canMakeProposal;

  return {
    checkout,
    proposal,
    checkoutMethods,
    proposalMethods,
    primaryFlow: checkout ? 'CHECKOUT' : 'PROPOSAL',
  };
}
