import type {
  AgreementHubDealItem,
  AgreementHubItem,
  AgreementHubProposalItem,
  AgreementsHubFilter,
} from './agreements-hub-types';
import {
  buildDealAgreementTimeline,
  dealPrimaryCtaRequiresUserAction,
  proposalNeedsUserResponse,
} from './agreement-timeline';

function uniqueFacets(
  facets: AgreementsHubFilter[],
): AgreementsHubFilter[] {
  return [...new Set(facets)];
}

export function classifyProposalFacets(
  item: Pick<AgreementHubProposalItem, 'proposal' | 'canRespond'>,
  userId: string,
): AgreementsHubFilter[] {
  const facets: AgreementsHubFilter[] = ['OPEN'];
  if (proposalNeedsUserResponse(item.proposal, userId)) {
    facets.push('ACTION_REQUIRED');
  } else {
    facets.push('IN_PROGRESS');
  }
  return uniqueFacets(facets);
}

function dealWaitsForPayment(deal: AgreementHubDealItem): boolean {
  const { paymentStatus, dealUx } = deal.deal;
  return paymentStatus === 'WAITING_HOMECHEFF' || dealUx.showPaymentRequired;
}

function dealWaitsForDelivery(deal: AgreementHubDealItem): boolean {
  if (!deal.deal.deliveryRequired) return false;
  return (
    deal.deal.deliveryStatus === 'REQUESTED_PENDING' ||
    deal.deal.deliveryStatus === 'OPEN' ||
    deal.deal.deliveryStatus === 'CLAIMED' ||
    deal.deal.deliveryStatus === 'ASSIGNED' ||
    deal.deal.deliveryStatus === 'IN_PROGRESS' ||
    deal.deal.deliveryStatus === 'AVAILABLE'
  );
}

export function classifyDealFacets(deal: AgreementHubDealItem): AgreementsHubFilter[] {
  const facets: AgreementsHubFilter[] = [];
  const status = deal.deal.status;

  if (status === 'COMPLETED') {
    return ['COMPLETED'];
  }
  if (status === 'CANCELLED') {
    return ['CANCELLED'];
  }

  facets.push('OPEN');

  const ctaKind = deal.deal.dealUx.primaryCta.kind;
  if (dealPrimaryCtaRequiresUserAction(ctaKind)) {
    facets.push('ACTION_REQUIRED');
  } else {
    facets.push('IN_PROGRESS');
  }

  if (dealWaitsForPayment(deal)) facets.push('WAITING_PAYMENT');
  if (dealWaitsForDelivery(deal)) facets.push('WAITING_DELIVERY');

  return uniqueFacets(facets);
}

export function itemMatchesFilter(
  item: AgreementHubItem,
  filter: AgreementsHubFilter,
): boolean {
  if (!filter) return true;
  return item.facets.includes(filter);
}

export function countByFilter(
  items: AgreementHubItem[],
): Record<AgreementsHubFilter, number> {
  const counts: Record<AgreementsHubFilter, number> = {
    '': items.length,
    ACTION_REQUIRED: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_PAYMENT: 0,
    WAITING_DELIVERY: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  for (const item of items) {
    for (const facet of item.facets) {
      if (facet) counts[facet] += 1;
    }
  }

  return counts;
}

export function attachDealFacets(item: AgreementHubDealItem): AgreementHubDealItem {
  return {
    ...item,
    facets: classifyDealFacets(item),
    timeline: buildDealAgreementTimeline(item.deal),
  };
}

export function attachProposalFacets(
  item: AgreementHubProposalItem,
  userId: string,
): AgreementHubProposalItem {
  return {
    ...item,
    facets: classifyProposalFacets(item, userId),
  };
}
