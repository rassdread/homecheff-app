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

import type { SettlementOptions, SettlementOptionsInput } from './settlement-options';
import { resolveSettlementOptions } from './settlement-options';
import { blocksHomecheffCartCheckout } from '../commerce/barter-commerce-alignment';
import {
  hasPublicDisplayPrice,
  isHomecheffCheckoutProduct,
} from '@/lib/product/order-method';

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

/** Shared product fields for settlement CTA resolution. */
export type MarketplaceSettlementProduct = {
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  orderMethod?: string | null;
  barterOpenness?: string | null;
  acceptedSpecializations?: string[] | null;
  priceCents?: number | null;
  priceModel?: string | null;
  listingIntent?: string | null;
};

export type MarketplaceCtaContext = SettlementOptionsInput & {
  hasContactChannels?: boolean;
  inStock?: boolean;
  isOwner?: boolean;
};

export type MarketplaceCtaActions = {
  options: SettlementOptions;
  flows: SettlementFlowAvailability;
  showCheckout: boolean;
  showProposal: boolean;
  showContactOnly: boolean;
  checkoutNeedsConnect: boolean;
  showDualPath: boolean;
  primaryFlow: SettlementFlow;
  checkoutLabelKey: 'marketplace.cta.checkoutHomeCheff';
  proposalLabelKey: string;
  conversationLabelKey: 'marketplace.cta.startConversation';
};

export function toMarketplaceCtaContext(
  product: MarketplaceSettlementProduct,
  context: {
    stripeConnectReady?: boolean | null;
    hasContactChannels?: boolean;
    inStock?: boolean;
    isOwner?: boolean;
  } = {},
): MarketplaceCtaContext {
  return {
    acceptHomeCheffPayment: product.acceptHomeCheffPayment,
    acceptDirectContact: product.acceptDirectContact,
    orderMethod: product.orderMethod,
    barterOpenness: product.barterOpenness,
    acceptedSpecializations: product.acceptedSpecializations,
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    listingIntent: product.listingIntent,
    stripeConnectReady: context.stripeConnectReady,
    hasContactChannels: context.hasContactChannels,
    inStock: context.inStock,
    isOwner: context.isOwner,
  };
}

/** Proposal CTA copy follows the dominant non-checkout settlement method. */
export function resolveProposalCtaLabelKey(
  flows: SettlementFlowAvailability,
  listingIntent?: string | null,
): string {
  if (String(listingIntent ?? '').toUpperCase() === 'REQUEST') {
    return 'marketplace.cta.makeProposal';
  }
  const methods = flows.proposalMethods;
  if (methods.includes('BARTER') && methods.length === 1) {
    return 'marketplace.cta.discussBarter';
  }
  if (
    methods.includes('DIRECT_CONTACT') &&
    !methods.includes('BARTER') &&
    !methods.includes('ACCEPTED_VALUE')
  ) {
    return 'marketplace.cta.arrangeDirect';
  }
  if (methods.includes('ACCEPTED_VALUE') || methods.includes('BARTER')) {
    return 'marketplace.cta.makeProposal';
  }
  return 'marketplace.cta.startConversation';
}

/**
 * Single CTA resolver for every marketplace surface — uses settlement-options
 * + flow availability. Category, intent and price model do not gate routing.
 */
export function resolveMarketplaceCtaActions(
  input: MarketplaceCtaContext,
): MarketplaceCtaActions {
  const options = resolveSettlementOptions(input);
  const flows = resolveSettlementFlowAvailability(options);
  const barterBlocksCheckout = blocksHomecheffCartCheckout(input.barterOpenness);
  const inStock = input.inStock !== false;
  const isOwner = !!input.isOwner;
  const hasChannels = input.hasContactChannels !== false;

  const showCheckout =
    !isOwner && inStock && flows.checkout && !barterBlocksCheckout;

  const showProposal =
    !isOwner && hasChannels && (flows.proposal || options.canMakeProposal);

  const showContactOnly =
    !isOwner &&
    !showCheckout &&
    showProposal &&
    options.acceptsDirectContact &&
    !options.acceptsHomeCheffCheckout &&
    !options.allowsBarter &&
    !options.hasAcceptedValues;

  const checkoutNeedsConnect = options.homeCheffCheckoutNeedsConnect && !showCheckout;

  return {
    options,
    flows,
    showCheckout,
    showProposal,
    showContactOnly,
    checkoutNeedsConnect,
    showDualPath: showCheckout && showProposal,
    primaryFlow: flows.primaryFlow,
    checkoutLabelKey: 'marketplace.cta.checkoutHomeCheff',
    proposalLabelKey: resolveProposalCtaLabelKey(flows, input.listingIntent),
    conversationLabelKey: 'marketplace.cta.startConversation',
  };
}

/** Server/checkout gate — HomeCheff Checkout allowed for this listing now. */
export function productAllowsHomecheffCheckout(
  input: SettlementOptionsInput & { sellerStripeReady?: boolean | null },
): boolean {
  const options = resolveSettlementOptions({
    ...input,
    stripeConnectReady: input.sellerStripeReady,
  });
  return (
    options.canCheckoutNow && !blocksHomecheffCartCheckout(input.barterOpenness)
  );
}

export type CheckoutBlockReason =
  | 'CONTACT_ONLY'
  | 'BARTER_ONLY'
  | 'PAYMENTS_NOT_READY'
  | 'NOT_ELIGIBLE';

/** Classify why checkout is blocked (preserves existing API error keys). */
export function resolveCheckoutBlockReason(
  input: SettlementOptionsInput & { sellerStripeReady?: boolean | null },
): CheckoutBlockReason | null {
  if (productAllowsHomecheffCheckout(input)) return null;
  if (blocksHomecheffCartCheckout(input.barterOpenness)) return 'BARTER_ONLY';
  const options = resolveSettlementOptions({
    ...input,
    stripeConnectReady: input.sellerStripeReady,
  });
  if (!options.acceptsHomeCheffCheckout && options.acceptsDirectContact) {
    return 'CONTACT_ONLY';
  }
  if (options.homeCheffCheckoutNeedsConnect || options.homeCheffCheckoutSelectable) {
    if (
      isHomecheffCheckoutProduct({
        acceptHomeCheffPayment: input.acceptHomeCheffPayment,
        acceptDirectContact: input.acceptDirectContact,
        orderMethod: input.orderMethod,
      }) &&
      hasPublicDisplayPrice({ priceCents: input.priceCents }) &&
      !input.sellerStripeReady
    ) {
      return 'PAYMENTS_NOT_READY';
    }
  }
  return 'NOT_ELIGIBLE';
}
