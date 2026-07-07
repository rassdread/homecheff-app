/**
 * Merge ListingKind action matrix (4C) with barter commerce alignment (5E-B).
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { resolveProductCommerceActions } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import {
  actionsForDetailKind,
  primaryActionForKind,
} from './detail-action-matrix';
import { listingKindToDetailKind } from './detail-page-contract';
import type { DetailActionId } from './detail-page-contract';

export type ResolvedDetailPageActions = {
  detailKind: ReturnType<typeof listingKindToDetailKind>;
  showOrder: boolean;
  showProposal: boolean;
  showContact: boolean;
  showMessage: boolean;
  primaryActionId: DetailActionId | null;
  proposalPrimary: boolean;
};

export function resolveDetailPageActions(input: {
  listingKind: ListingKind;
  barterOpenness?: string | null;
}): ResolvedDetailPageActions {
  const detailKind = listingKindToDetailKind(input.listingKind) ?? 'PRODUCT';
  const allowed = new Set(actionsForDetailKind(detailKind).map((a) => a.id));
  const commerce = resolveProductCommerceActions(input.barterOpenness);
  const kindPrimary = primaryActionForKind(detailKind);

  const showOrder = allowed.has('order') && commerce.showOrderCheckout;
  const showProposal =
    commerce.showProposalCta ||
    (allowed.has('request_proposal') && kindPrimary?.id === 'request_proposal');
  const showContact = allowed.has('contact');
  const showMessage = allowed.has('message');

  let primaryActionId: DetailActionId | null = kindPrimary?.id ?? null;
  if (primaryActionId === 'order' && !showOrder) {
    primaryActionId = showProposal
      ? 'request_proposal'
      : showContact
        ? 'contact'
        : showMessage
          ? 'message'
          : null;
  }
  if (primaryActionId === 'request_proposal' && !showProposal) {
    primaryActionId = showOrder
      ? 'order'
      : showContact
        ? 'contact'
        : null;
  }

  return {
    detailKind,
    showOrder,
    showProposal,
    showContact,
    showMessage,
    primaryActionId,
    proposalPrimary: primaryActionId === 'request_proposal',
  };
}
