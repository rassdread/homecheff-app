import type { SettlementMode } from '@prisma/client';
import type { ProposalPaymentPath } from './proposal-product-binding';
import type { ProposalSummarySnapshot } from './proposal-settlement';

export type ProposalNextAction =
  | 'NONE'
  | 'COMMUNITY_ORDER_CREATED'
  | 'CHECKOUT_REQUIRED'
  | 'DELIVERY_REQUEST_READY'
  | 'DELIVERY_REQUEST_CREATED';

export type AcceptRoutingResult = {
  nextAction: ProposalNextAction;
  checkoutUrl: string | null;
  deliveryRequestId: string | null;
};

export function resolveAcceptNextAction(input: {
  settlementMode: SettlementMode;
  paymentPath: ProposalPaymentPath;
  productId: string | null;
  quantity: number | null;
  communityOrderId: string;
  deliveryRequested: boolean;
  deliveryRequestId: string | null;
  deliveryRequestReady: boolean;
}): AcceptRoutingResult {
  const moneyLeg =
    input.settlementMode === 'MONEY' ||
    input.settlementMode === 'MONEY_AND_VALUE';

  let nextAction: ProposalNextAction = 'COMMUNITY_ORDER_CREATED';
  let checkoutUrl: string | null = null;

  if (moneyLeg && input.paymentPath === 'HOMECHEFF_CHECKOUT' && input.productId) {
    nextAction = 'CHECKOUT_REQUIRED';
    const qty = input.quantity ?? 1;
    const params = new URLSearchParams({
      productId: input.productId,
      quantity: String(qty),
      communityOrderId: input.communityOrderId,
    });
    checkoutUrl = `/checkout?${params.toString()}`;
  }

  if (input.deliveryRequestId) {
    nextAction =
      nextAction === 'CHECKOUT_REQUIRED'
        ? 'CHECKOUT_REQUIRED'
        : 'DELIVERY_REQUEST_CREATED';
  } else if (input.deliveryRequested && input.deliveryRequestReady) {
    if (nextAction === 'COMMUNITY_ORDER_CREATED') {
      nextAction = 'DELIVERY_REQUEST_READY';
    }
  }

  if (
    nextAction === 'COMMUNITY_ORDER_CREATED' &&
    !input.deliveryRequested &&
    input.paymentPath !== 'HOMECHEFF_CHECKOUT'
  ) {
    nextAction = 'COMMUNITY_ORDER_CREATED';
  }

  return {
    nextAction,
    checkoutUrl,
    deliveryRequestId: input.deliveryRequestId,
  };
}

export function paymentPathFromSummary(
  summary: ProposalSummarySnapshot | null | undefined,
): ProposalPaymentPath {
  return summary?.paymentPath ?? 'NONE';
}
