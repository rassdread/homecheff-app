/**
 * Marketplace preview content types — built from MarketplaceTileModel only.
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { TileBadge } from '@/lib/marketplace/tiles/types';

export type PreviewPaymentBlock = {
  primary: string;
  secondary: string | null;
};

export type PreviewFulfillmentItem = {
  key: string;
  labelKey: string;
};

export type PreviewAcceptedValue = {
  id: string;
  label: string;
  icon?: string;
};

export type PreviewTrustLine = {
  id: string;
  text: string;
};

export type PreviewTrustBadge = {
  key: string;
  name: string;
};

export type MarketplacePreviewContent = {
  listingKind: ListingKind;
  title: string;
  description: string | null;
  payment: PreviewPaymentBlock | null;
  fulfillment: PreviewFulfillmentItem[];
  acceptedValues: PreviewAcceptedValue[];
  acceptedOverflow: number;
  trustLines: PreviewTrustLine[];
  trustBadges: PreviewTrustBadge[];
  showTrust: boolean;
  workshopDate: string | null;
  workshopLocation: string | null;
  capacityRemaining: number | null;
  neededBy: string | null;
  inspirationCategory: string | null;
  creatorName: string | null;
  availabilityNote: string | null;
  responseExpectation: string | null;
  onlineOffline: string | null;
  requestSummary: string | null;
  compensationNote: string | null;
};

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export const PREVIEW_ACCEPTED_MAX = 6;

export const PREVIEW_FORBIDDEN_SIGNALS = [
  'averageRating',
  'blendedRating',
  'viewCount',
  'fansCount',
  'followers',
  'hcpPoints',
  'workspacePropsCount',
] as const;
