import type { DealPrimaryCtaKind } from '@/lib/proposals/deal-ux-state';
import type { CommunityOrderDTO, ProposalDTO } from '@/lib/proposals/proposal-types';
import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import type {
  AgreementHubProposalItem,
  AgreementTimelineStep,
  AgreementTimelineStepId,
} from './agreements-hub-types';

const TIMELINE_LABELS: Record<AgreementTimelineStepId, string> = {
  proposal: 'marketplace.agreements.timeline.proposal',
  accepted: 'marketplace.agreements.timeline.accepted',
  payment: 'marketplace.agreements.timeline.payment',
  delivery: 'marketplace.agreements.timeline.delivery',
  complete: 'marketplace.agreements.timeline.complete',
};

function step(
  id: AgreementTimelineStepId,
  state: AgreementTimelineStep['state'],
): AgreementTimelineStep {
  return { id, labelKey: TIMELINE_LABELS[id], state };
}

function hasPaymentLeg(proposal: ProposalDTO): boolean {
  return (
    proposal.settlementMode === 'MONEY' ||
    proposal.settlementMode === 'MONEY_AND_VALUE'
  );
}

function hasDeliveryLeg(
  communityOrder?: CommunityOrderDTO | null,
  deliveryRequired?: boolean,
): boolean {
  if (!communityOrder && !deliveryRequired) return false;
  if (communityOrder) {
    return (
      communityOrder.fulfillmentMode === 'DELIVERY' ||
      communityOrder.deliveryRequested
    );
  }
  return Boolean(deliveryRequired);
}

export function buildProposalAgreementTimeline(
  proposal: ProposalDTO,
): AgreementTimelineStep[] {
  const activeProposal = proposal.status === 'PENDING';
  return [
    step('proposal', activeProposal ? 'active' : 'done'),
    step('accepted', 'upcoming'),
    step(
      'payment',
      hasPaymentLeg(proposal) ? 'upcoming' : 'skipped',
    ),
    step('delivery', 'upcoming'),
    step('complete', 'upcoming'),
  ];
}

export function buildDealAgreementTimeline(deal: ProfileDealDTO): AgreementTimelineStep[] {
  const { proposal, status, dealUx, deliveryRequired } = deal;
  const paymentLeg = hasPaymentLeg(proposal);
  const deliveryLeg = hasDeliveryLeg(deal, deliveryRequired);

  const acceptedDone = status !== 'OPEN' || Boolean(deal.agreementId);
  const paymentDone =
    !paymentLeg ||
    deal.paymentStatus === 'PAID' ||
    deal.paymentStatus === 'NOT_APPLICABLE' ||
    deal.paymentStatus === 'VOLUNTARY' ||
    deal.paymentStatus === 'FREE' ||
    status === 'COMPLETED';
  const deliveryDone =
    !deliveryLeg ||
    deal.deliveryStatus === 'COMPLETED' ||
    deal.deliveryStatus === 'NOT_APPLICABLE';
  const completeDone = status === 'COMPLETED';
  const cancelled = status === 'CANCELLED';

  if (cancelled) {
    return [
      step('proposal', 'done'),
      step('accepted', 'done'),
      step('payment', paymentLeg ? 'skipped' : 'skipped'),
      step('delivery', deliveryLeg ? 'skipped' : 'skipped'),
      step('complete', 'skipped'),
    ];
  }

  let paymentState: AgreementTimelineStep['state'] = paymentLeg
    ? 'upcoming'
    : 'skipped';
  if (paymentDone) paymentState = 'done';
  else if (
    dealUx.showPaymentRequired &&
    acceptedDone &&
    status === 'OPEN'
  ) {
    paymentState = 'active';
  }

  let deliveryState: AgreementTimelineStep['state'] = deliveryLeg
    ? 'upcoming'
    : 'skipped';
  if (deliveryDone) deliveryState = 'done';
  else if (
    deliveryLeg &&
    paymentDone &&
    status === 'OPEN' &&
    (deal.deliveryStatus === 'REQUESTED_PENDING' ||
      deal.deliveryStatus === 'OPEN' ||
      deal.deliveryStatus === 'CLAIMED' ||
      deal.deliveryStatus === 'ASSIGNED' ||
      deal.deliveryStatus === 'IN_PROGRESS')
  ) {
    deliveryState = 'active';
  }

  let completeState: AgreementTimelineStep['state'] = 'upcoming';
  if (completeDone) completeState = 'done';
  else if (
    status === 'OPEN' &&
    paymentDone &&
    (!deliveryLeg || deliveryDone)
  ) {
    completeState = 'active';
  }

  return [
    step('proposal', 'done'),
    step('accepted', acceptedDone ? 'done' : 'active'),
    step('payment', paymentState),
    step('delivery', deliveryState),
    step('complete', completeState),
  ];
}

export function proposalNeedsUserResponse(
  proposal: ProposalDTO,
  userId: string,
): boolean {
  return proposal.status === 'PENDING' && proposal.createdById !== userId;
}

export function dealPrimaryCtaRequiresUserAction(
  kind: DealPrimaryCtaKind,
): boolean {
  return (
    kind === 'PAY_CHECKOUT' ||
    kind === 'DISCUSS_PAYMENT' ||
    kind === 'MARK_COMPLETE' ||
    kind === 'REQUEST_DELIVERY' ||
    kind === 'REVIEW_DEAL' ||
    kind === 'REVIEW_DELIVERY'
  );
}

export function buildProposalHubPresentation(
  proposal: ProposalDTO,
  userId: string,
  counterpartName: string | null,
): Pick<
  AgreementHubProposalItem,
  'canRespond' | 'nextStepHintKey' | 'primaryCtaLabelKey'
> {
  const canRespond = proposalNeedsUserResponse(proposal, userId);
  return {
    canRespond,
    nextStepHintKey: canRespond
      ? 'marketplace.agreements.proposal.nextRespond'
      : 'marketplace.agreements.proposal.nextWaiting',
    primaryCtaLabelKey: canRespond
      ? 'marketplace.agreements.proposal.ctaRespond'
      : 'marketplace.agreements.actions.openChat',
  };
}
