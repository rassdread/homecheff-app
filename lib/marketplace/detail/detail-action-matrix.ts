/**
 * Detail action block per ListingKind — Phase 4C.
 */

import type { DetailActionContract, DetailPageKind } from './detail-page-contract';
import { DETAIL_PAGE_KINDS } from './detail-page-contract';

const KEY = 'marketplace.detail.actions';

const BASE_ACTIONS: Record<string, DetailActionContract> = {
  message: {
    id: 'message',
    labelKey: `${KEY}.message`,
    primary: false,
    mobileSticky: false,
  },
  save: {
    id: 'save',
    labelKey: `${KEY}.save`,
    primary: false,
    mobileSticky: false,
  },
  share: {
    id: 'share',
    labelKey: `${KEY}.share`,
    primary: false,
    mobileSticky: false,
  },
  edit: {
    id: 'edit',
    labelKey: `${KEY}.edit`,
    primary: false,
    mobileSticky: false,
  },
  contact: {
    id: 'contact',
    labelKey: `${KEY}.contact`,
    primary: false,
    mobileSticky: true,
  },
  order: {
    id: 'order',
    labelKey: `${KEY}.order`,
    primary: true,
    mobileSticky: true,
  },
  request_proposal: {
    id: 'request_proposal',
    labelKey: `${KEY}.requestProposal`,
    primary: true,
    mobileSticky: true,
  },
  print: {
    id: 'print',
    labelKey: `${KEY}.print`,
    primary: false,
    mobileSticky: false,
  },
};

export const DETAIL_ACTION_MATRIX: Record<DetailPageKind, DetailActionContract[]> = {
  PRODUCT: [
    BASE_ACTIONS.order!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  SERVICE: [
    BASE_ACTIONS.contact!,
    BASE_ACTIONS.request_proposal!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  TASK: [
    BASE_ACTIONS.contact!,
    BASE_ACTIONS.request_proposal!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  WORKSHOP: [
    BASE_ACTIONS.order!,
    BASE_ACTIONS.contact!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  COACHING: [
    BASE_ACTIONS.contact!,
    BASE_ACTIONS.request_proposal!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  DELIVERY: [
    BASE_ACTIONS.message!,
    BASE_ACTIONS.contact!,
    BASE_ACTIONS.share!,
  ],
  REQUEST: [
    BASE_ACTIONS.request_proposal!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.edit!,
  ],
  INSPIRATION: [
    BASE_ACTIONS.save!,
    BASE_ACTIONS.share!,
    BASE_ACTIONS.print!,
    BASE_ACTIONS.message!,
    BASE_ACTIONS.edit!,
  ],
};

export function actionsForDetailKind(
  kind: DetailPageKind,
): DetailActionContract[] {
  return DETAIL_ACTION_MATRIX[kind] ?? [];
}

export function primaryActionForKind(
  kind: DetailPageKind,
): DetailActionContract | null {
  return actionsForDetailKind(kind).find((a) => a.primary) ?? null;
}

export function stickyMobileActions(
  kind: DetailPageKind,
): DetailActionContract[] {
  return actionsForDetailKind(kind).filter((a) => a.mobileSticky);
}

export function allDetailKindsHaveActions(): boolean {
  return DETAIL_PAGE_KINDS.every(
    (k) => DETAIL_ACTION_MATRIX[k].length > 0,
  );
}
