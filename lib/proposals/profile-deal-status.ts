import type { SettlementMode } from '@prisma/client';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import { resolveDealUxState } from './deal-ux-state';
import { paymentPathFromSummary } from './proposal-accept-routing';
import { PROFILE_DEALS_I18N } from './proposal-i18n-keys';
import type { CommunityOrderDTO, ProposalDTO } from './proposal-types';
import type {
  ProfileDealDeliveryStatus,
  ProfileDealPaymentStatus,
  ProfileDealStatusBlock,
  ProfileDealUserRole,
} from './profile-deal-types';

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

export function resolveProfileDealPaymentStatus(input: {
  proposal: ProposalDTO;
  communityOrder: CommunityOrderDTO;
}): ProfileDealPaymentStatus {
  const { proposal, communityOrder } = input;
  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);
  const moneyLeg = hasMoneyLeg(proposal.settlementMode);

  if (!moneyLeg) {
    if (proposal.settlementMode === 'VOLUNTARY') return 'VOLUNTARY';
    if (proposal.settlementMode === 'FREE') return 'FREE';
    return 'NOT_APPLICABLE';
  }

  if (communityOrder.checkoutOrderId) return 'PAID';
  if (paymentPath === 'HOMECHEFF_CHECKOUT') return 'WAITING_HOMECHEFF';
  if (paymentPath === 'DIRECT_CONTACT') return 'DIRECT_CONTACT';
  return 'NOT_APPLICABLE';
}

export function resolveProfileDealDeliveryStatus(input: {
  communityOrder: CommunityOrderDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
}): ProfileDealDeliveryStatus {
  const { communityOrder, deliveryRequest } = input;
  const deliveryMode =
    communityOrder.fulfillmentMode === 'DELIVERY' ||
    communityOrder.deliveryRequested;

  if (!deliveryMode) return 'NOT_APPLICABLE';

  if (!communityOrder.deliveryRequested) return 'AVAILABLE';

  if (!deliveryRequest) return 'REQUESTED_PENDING';

  if (deliveryRequest.status === 'CANCELLED') return 'CANCELLED';
  if (deliveryRequest.status === 'COMPLETED') return 'COMPLETED';

  const assignment = deliveryRequest.activeAssignment;
  if (assignment?.status === 'ACCEPTED') return 'IN_PROGRESS';

  if (deliveryRequest.status === 'ASSIGNED') return 'ASSIGNED';
  if (deliveryRequest.status === 'CLAIMED') return 'CLAIMED';
  return 'OPEN';
}

export function formatRequestedWindowLabel(input: {
  proposal: ProposalDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
}): string | null {
  const { proposal, deliveryRequest } = input;
  const parts: string[] = [];

  if (deliveryRequest?.pickupTimeWindow) {
    parts.push(deliveryRequest.pickupTimeWindow);
  }
  if (deliveryRequest?.deliveryTimeWindow) {
    parts.push(deliveryRequest.deliveryTimeWindow);
  }
  if (parts.length > 0) return parts.join(' · ');

  if (proposal.requestedTimeWindow) return proposal.requestedTimeWindow;
  if (proposal.requestedDate) {
    try {
      return new Date(proposal.requestedDate).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return proposal.requestedDate;
    }
  }
  return null;
}

function proposalBlockKey(
  communityOrder: CommunityOrderDTO,
): { labelKey: string; tone: ProfileDealStatusBlock['tone'] } {
  switch (communityOrder.status) {
    case 'COMPLETED':
      return {
        labelKey: PROFILE_DEALS_I18N.status.proposal.completed,
        tone: 'success',
      };
    case 'CANCELLED':
      return {
        labelKey: PROFILE_DEALS_I18N.status.proposal.cancelled,
        tone: 'neutral',
      };
    default:
      return {
        labelKey: PROFILE_DEALS_I18N.status.proposal.confirmed,
        tone: 'info',
      };
  }
}

function paymentBlockKey(
  paymentStatus: ProfileDealPaymentStatus,
): { labelKey: string; tone: ProfileDealStatusBlock['tone'] } | null {
  switch (paymentStatus) {
    case 'WAITING_HOMECHEFF':
      return {
        labelKey: PROFILE_DEALS_I18N.status.payment.waitingHomecheff,
        tone: 'warning',
      };
    case 'PAID':
      return {
        labelKey: PROFILE_DEALS_I18N.status.payment.paid,
        tone: 'success',
      };
    case 'DIRECT_CONTACT':
      return {
        labelKey: PROFILE_DEALS_I18N.status.payment.directContact,
        tone: 'warning',
      };
    case 'VOLUNTARY':
      return {
        labelKey: PROFILE_DEALS_I18N.status.payment.voluntary,
        tone: 'info',
      };
    case 'FREE':
      return {
        labelKey: PROFILE_DEALS_I18N.status.payment.free,
        tone: 'info',
      };
    default:
      return null;
  }
}

function exchangeBlockKey(
  proposal: ProposalDTO,
  communityOrder: CommunityOrderDTO,
): { labelKey: string; tone: ProfileDealStatusBlock['tone'] } | null {
  if (!hasValueLeg(proposal)) return null;
  if (communityOrder.status === 'COMPLETED') {
    return {
      labelKey: PROFILE_DEALS_I18N.status.exchange.completed,
      tone: 'success',
    };
  }
  return {
    labelKey: PROFILE_DEALS_I18N.status.exchange.confirmed,
    tone: 'info',
  };
}

function deliveryBlockKey(
  deliveryStatus: ProfileDealDeliveryStatus,
  courierName: string | null,
): { labelKey: string; tone: ProfileDealStatusBlock['tone'] } | null {
  switch (deliveryStatus) {
    case 'NOT_APPLICABLE':
      return null;
    case 'AVAILABLE':
      return {
        labelKey: PROFILE_DEALS_I18N.status.delivery.available,
        tone: 'neutral',
      };
    case 'REQUESTED_PENDING':
      return {
        labelKey: PROFILE_DEALS_I18N.status.delivery.requestedPending,
        tone: 'warning',
      };
    case 'OPEN':
    case 'CLAIMED':
      return {
        labelKey: PROFILE_DEALS_I18N.status.delivery.requested,
        tone: 'info',
      };
    case 'ASSIGNED':
      return {
        labelKey: courierName
          ? PROFILE_DEALS_I18N.status.delivery.courierAssignedNamed
          : PROFILE_DEALS_I18N.status.delivery.courierAssigned,
        tone: 'info',
      };
    case 'IN_PROGRESS':
      return {
        labelKey: courierName
          ? PROFILE_DEALS_I18N.status.delivery.inProgressNamed
          : PROFILE_DEALS_I18N.status.delivery.inProgress,
        tone: 'info',
      };
    case 'COMPLETED':
      return {
        labelKey: PROFILE_DEALS_I18N.status.delivery.completed,
        tone: 'success',
      };
    case 'CANCELLED':
      return {
        labelKey: PROFILE_DEALS_I18N.status.delivery.cancelled,
        tone: 'neutral',
      };
    default:
      return null;
  }
}

export function buildProfileDealStatusBlocks(input: {
  proposal: ProposalDTO;
  communityOrder: CommunityOrderDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
  paymentStatus: ProfileDealPaymentStatus;
  deliveryStatus: ProfileDealDeliveryStatus;
  dealUx: ReturnType<typeof resolveDealUxState>;
  courierName: string | null;
}): ProfileDealStatusBlock[] {
  const blocks: ProfileDealStatusBlock[] = [];

  const proposalBlock = proposalBlockKey(input.communityOrder);
  blocks.push({ kind: 'proposal', ...proposalBlock });

  const paymentBlock = paymentBlockKey(input.paymentStatus);
  if (paymentBlock) {
    blocks.push({ kind: 'payment', ...paymentBlock });
  }

  const exchangeBlock = exchangeBlockKey(
    input.proposal,
    input.communityOrder,
  );
  if (exchangeBlock) {
    blocks.push({ kind: 'exchange', ...exchangeBlock });
  }

  const deliveryBlock = deliveryBlockKey(
    input.deliveryStatus,
    input.courierName,
  );
  if (deliveryBlock) {
    blocks.push({ kind: 'delivery', ...deliveryBlock });
  }

  if (input.communityOrder.status === 'OPEN') {
    blocks.push({
      kind: 'nextAction',
      labelKey: input.dealUx.nextStepHintKey,
      tone: input.dealUx.showPaymentRequired ? 'warning' : 'info',
    });
  }

  return blocks;
}

export function resolveProfileDealPresentation(input: {
  proposal: ProposalDTO;
  communityOrder: CommunityOrderDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
  userRoleInDeal: ProfileDealUserRole;
  canReview?: boolean;
}) {
  const paymentPath = paymentPathFromSummary(input.proposal.proposalSummary);
  const paymentStatus = resolveProfileDealPaymentStatus({
    proposal: input.proposal,
    communityOrder: input.communityOrder,
  });
  const deliveryStatus = resolveProfileDealDeliveryStatus({
    communityOrder: input.communityOrder,
    deliveryRequest: input.deliveryRequest,
  });
  const dealUx = resolveDealUxState({
    proposal: input.proposal,
    communityOrder: input.communityOrder,
    deliveryRequest: input.deliveryRequest,
    canReviewDeal: input.canReview,
  });
  const courierName = input.deliveryRequest?.courierName ?? null;
  const statusBlocks = buildProfileDealStatusBlocks({
    proposal: input.proposal,
    communityOrder: input.communityOrder,
    deliveryRequest: input.deliveryRequest,
    paymentStatus,
    deliveryStatus,
    dealUx,
    courierName,
  });

  return {
    paymentPath,
    paymentStatus,
    deliveryStatus,
    deliveryRequired:
      input.communityOrder.fulfillmentMode === 'DELIVERY' ||
      input.communityOrder.deliveryRequested,
    dealUx,
    statusBlocks,
    pickupLabel: input.deliveryRequest?.pickupAddress ?? null,
    dropoffLabel: input.deliveryRequest?.deliveryAddress ?? null,
    requestedWindowLabel: formatRequestedWindowLabel({
      proposal: input.proposal,
      deliveryRequest: input.deliveryRequest,
    }),
    deliveryRequestId: input.deliveryRequest?.id ?? null,
    courierAssignmentStatus:
      input.deliveryRequest?.activeAssignment?.status ?? null,
    courierName,
    courierUserId: input.deliveryRequest?.courierId ?? null,
    checkoutUrl: dealUx.checkoutUrl,
  };
}
