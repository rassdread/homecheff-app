/**
 * Marketplace detail page contracts — Phase 4C.
 * Canonical section order and layout tiers; no UI wiring yet.
 * @see docs/architecture/MARKETPLACE_DETAIL_PAGE_SYSTEM.md
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';

/** Canonical detail section order (all marketplace kinds). */
export const DETAIL_SECTION_IDS = [
  'hero_media',
  'person_row',
  'value_exchange',
  'trust_block',
  'description',
  'availability',
  'reviews',
  'related_listings',
  'action_block',
] as const;

/** Optional 4F slot between value_exchange and trust_block — not in canonical section order. */
export const DETAIL_EXCHANGE_SUGGESTIONS_SLOT = 'exchange_suggestions' as const;

export type DetailSectionId = (typeof DETAIL_SECTION_IDS)[number];

export const DETAIL_LAYOUT_TIERS = ['mobile', 'desktop'] as const;
export type DetailLayoutTier = (typeof DETAIL_LAYOUT_TIERS)[number];

/** Detail kinds including delivery profile and inspiration. */
export const DETAIL_PAGE_KINDS = [
  'PRODUCT',
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
  'DELIVERY',
  'REQUEST',
  'INSPIRATION',
] as const;

export type DetailPageKind = (typeof DETAIL_PAGE_KINDS)[number];

export function listingKindToDetailKind(
  kind: ListingKind,
): DetailPageKind | null {
  if (kind === 'INSPIRATION') return 'INSPIRATION';
  return DETAIL_PAGE_KINDS.includes(kind as DetailPageKind)
    ? (kind as DetailPageKind)
    : null;
}

export type DetailSectionVisibility = 'show' | 'hide' | 'collapsible';

export type DetailSectionPlan = {
  sectionId: DetailSectionId;
  visibility: DetailSectionVisibility;
};

export type DetailLayoutPlan = {
  tier: DetailLayoutTier;
  sections: DetailSectionPlan[];
  stickyActionBar: boolean;
  valueExchangeCollapsible: boolean;
  sidebarSticky: boolean;
};

export const DETAIL_FORBIDDEN_SIGNALS = [
  'blendedRating',
  'averageRating',
  'reputationScore',
  'hcpPoints',
  'viewCount',
  'workspacePropsCount',
  'followerCount',
  'fansCount',
  'itemPropsCount',
  'dishReviewCount',
] as const;

export type DetailForbiddenSignal = (typeof DETAIL_FORBIDDEN_SIGNALS)[number];

export const DETAIL_ACTION_IDS = [
  'order',
  'request_proposal',
  'message',
  'save',
  'share',
  'contact',
  'print',
  'edit',
] as const;

export type DetailActionId = (typeof DETAIL_ACTION_IDS)[number];

export type DetailActionContract = {
  id: DetailActionId;
  labelKey: string;
  primary: boolean;
  mobileSticky: boolean;
};

export function isCanonicalDetailSectionOrder(
  sections: readonly DetailSectionId[],
): boolean {
  if (sections.length !== DETAIL_SECTION_IDS.length) return false;
  return sections.every((id, i) => id === DETAIL_SECTION_IDS[i]);
}
