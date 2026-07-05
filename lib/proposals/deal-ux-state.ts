import type { SettlementMode } from '@prisma/client';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import {
  paymentPathFromSummary,
  type ProposalNextAction,
} from './proposal-accept-routing';
import type { CommunityOrderDTO, ProposalDTO } from './proposal-types';

export type DealPrimaryCtaKind =
  | 'COMPLETE'
  | 'PAY_CHECKOUT'
  | 'DISCUSS_PAYMENT'
  | 'COMPLETE_EXCHANGE'
  | 'REQUEST_DELIVERY'
  | 'VIEW_DELIVERY';

export type DealPrimaryCta = {
  kind: DealPrimaryCtaKind;
  labelKey: string;
  hintKey: string;
  href: string | null;
  deliveryRequestId: string | null;
};

export type DealUxState = {
  statusLabelKey: string;
  nextStepHintKey: string;
  primaryCta: DealPrimaryCta;
  nextAction: ProposalNextAction;
  checkoutUrl: string | null;
  showPaymentRequired: boolean;
  showDeliveryRequired: boolean;
  dealComplete: boolean;
};

function hasMoneyLeg(mode: SettlementMode): boolean {
  return mode === 'MONEY' || mode === 'MONEY_AND_VALUE';
}

function hasValueLeg(proposal: ProposalDTO): boolean {
  return (
    proposal.settlementMode === 'VALUE_ONLY' ||
    proposal.settlementMode === 'MONEY_AND_VALUE' ||
    proposal.settlementMode === 'FREE' ||
    proposal.settlementMode === 'VOLUNTARY' ||
    proposal.acceptedValueTaxonomyIds.length > 0 ||
    proposal.requestedValueTaxonomyIds.length > 0
  );
}

function buildCheckoutUrl(
  proposal: ProposalDTO,
  communityOrder: CommunityOrderDTO,
): string | null {
  if (!proposal.productId) return null;
  const qty = proposal.quantity ?? 1;
  const params = new URLSearchParams({
    productId: proposal.productId,
    quantity: String(qty),
    communityOrderId: communityOrder.id,
  });
  return `/checkout?${params.toString()}`;
}

function completeState(checkoutUrl: string | null): DealUxState {
  return {
    statusLabelKey: 'deal.status.completed',
    nextStepHintKey: 'deal.nextStep.complete',
    primaryCta: {
      kind: 'COMPLETE',
      labelKey: 'deal.cta.complete',
      hintKey: 'deal.nextStep.complete',
      href: null,
      deliveryRequestId: null,
    },
    nextAction: 'NONE',
    checkoutUrl,
    showPaymentRequired: false,
    showDeliveryRequired: false,
    dealComplete: true,
  };
}

export function resolveDealUxState(input: {
  proposal: ProposalDTO;
  communityOrder: CommunityOrderDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
}): DealUxState {
  const { proposal, communityOrder, deliveryRequest } = input;
  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);
  const moneyLeg = hasMoneyLeg(proposal.settlementMode);
  const valueLeg = hasValueLeg(proposal);
  const checkoutUrl =
    moneyLeg && paymentPath === 'HOMECHEFF_CHECKOUT' && proposal.productId
      ? buildCheckoutUrl(proposal, communityOrder)
      : null;
  const isPaid = Boolean(communityOrder.checkoutOrderId);
  const needsCheckout =
    moneyLeg && paymentPath === 'HOMECHEFF_CHECKOUT' && !isPaid;
  const showPaymentRequired = moneyLeg && !isPaid;
  const showDeliveryRequired =
    communityOrder.deliveryRequested && deliveryRequest == null;

  if (communityOrder.status === 'COMPLETED') {
    return completeState(checkoutUrl);
  }

  if (communityOrder.status === 'CANCELLED') {
    return {
      statusLabelKey: 'deal.status.cancelled',
      nextStepHintKey: 'deal.nextStep.cancelled',
      primaryCta: {
        kind: 'COMPLETE',
        labelKey: 'deal.cta.complete',
        hintKey: 'deal.nextStep.cancelled',
        href: null,
        deliveryRequestId: null,
      },
      nextAction: 'NONE',
      checkoutUrl,
      showPaymentRequired: false,
      showDeliveryRequired: false,
      dealComplete: true,
    };
  }

  if (needsCheckout) {
    return {
      statusLabelKey: 'deal.status.waitingPayment',
      nextStepHintKey: 'deal.nextStep.payHomecheff',
      primaryCta: {
        kind: 'PAY_CHECKOUT',
        labelKey: 'deal.cta.payHomecheff',
        hintKey: 'deal.nextStep.payHomecheff',
        href: checkoutUrl,
        deliveryRequestId: null,
      },
      nextAction: 'CHECKOUT_REQUIRED',
      checkoutUrl,
      showPaymentRequired: true,
      showDeliveryRequired,
      dealComplete: false,
    };
  }

  if (
    moneyLeg &&
    valueLeg &&
    isPaid &&
    paymentPath === 'HOMECHEFF_CHECKOUT'
  ) {
    return {
      statusLabelKey: 'deal.status.exchangePending',
      nextStepHintKey: 'deal.nextStep.exchangeValue',
      primaryCta: {
        kind: 'COMPLETE_EXCHANGE',
        labelKey: 'deal.cta.completeExchange',
        hintKey: 'deal.nextStep.exchangeValue',
        href: null,
        deliveryRequestId: null,
      },
      nextAction: 'COMMUNITY_ORDER_CREATED',
      checkoutUrl,
      showPaymentRequired: false,
      showDeliveryRequired,
      dealComplete: false,
    };
  }

  if (moneyLeg && paymentPath === 'DIRECT_CONTACT' && !isPaid) {
    return {
      statusLabelKey: 'deal.status.discussPayment',
      nextStepHintKey: 'deal.nextStep.discussPayment',
      primaryCta: {
        kind: 'DISCUSS_PAYMENT',
        labelKey: 'deal.cta.discussPayment',
        hintKey: 'deal.nextStep.discussPayment',
        href: null,
        deliveryRequestId: null,
      },
      nextAction: 'COMMUNITY_ORDER_CREATED',
      checkoutUrl,
      showPaymentRequired: true,
      showDeliveryRequired,
      dealComplete: false,
    };
  }

  if (deliveryRequest) {
    return {
      statusLabelKey: 'deal.status.deliveryActive',
      nextStepHintKey: 'deal.nextStep.viewDelivery',
      primaryCta: {
        kind: 'VIEW_DELIVERY',
        labelKey: 'deal.cta.viewDelivery',
        hintKey: 'deal.nextStep.viewDelivery',
        href: null,
        deliveryRequestId: deliveryRequest.id,
      },
      nextAction: 'DELIVERY_REQUEST_CREATED',
      checkoutUrl,
      showPaymentRequired: false,
      showDeliveryRequired: false,
      dealComplete: false,
    };
  }

  if (communityOrder.deliveryRequested) {
    return {
      statusLabelKey: 'deal.status.deliveryPending',
      nextStepHintKey: 'deal.nextStep.requestDelivery',
      primaryCta: {
        kind: 'REQUEST_DELIVERY',
        labelKey: 'deal.cta.requestDelivery',
        hintKey: 'deal.nextStep.requestDelivery',
        href: null,
        deliveryRequestId: null,
      },
      nextAction: 'DELIVERY_REQUEST_READY',
      checkoutUrl,
      showPaymentRequired: false,
      showDeliveryRequired: true,
      dealComplete: false,
    };
  }

  if (!moneyLeg && valueLeg) {
    return {
      statusLabelKey: 'deal.status.exchangePending',
      nextStepHintKey: 'deal.nextStep.exchangeValue',
      primaryCta: {
        kind: 'COMPLETE_EXCHANGE',
        labelKey: 'deal.cta.completeExchange',
        hintKey: 'deal.nextStep.exchangeValue',
        href: null,
        deliveryRequestId: null,
      },
      nextAction: 'COMMUNITY_ORDER_CREATED',
      checkoutUrl,
      showPaymentRequired: false,
      showDeliveryRequired: false,
      dealComplete: false,
    };
  }

  return {
    statusLabelKey: 'deal.status.confirmed',
    nextStepHintKey: 'deal.nextStep.discussDeal',
    primaryCta: {
      kind: 'DISCUSS_PAYMENT',
      labelKey: 'deal.cta.discussDeal',
      hintKey: 'deal.nextStep.discussDeal',
      href: null,
      deliveryRequestId: null,
    },
    nextAction: 'COMMUNITY_ORDER_CREATED',
    checkoutUrl,
    showPaymentRequired: false,
    showDeliveryRequired: false,
    dealComplete: false,
  };
}
