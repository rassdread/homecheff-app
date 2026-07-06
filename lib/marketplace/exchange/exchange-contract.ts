/**
 * Marketplace Exchange Matching — canonical contracts (Phase 4D).
 * Foundation only — no UI, ranking, or automated suggestions.
 * @see docs/architecture/MARKETPLACE_EXCHANGE_MATCHING.md
 */

import type { BarterOpenness, MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type {
  DesiredExchangeDetail,
  ValueExchangeMainCategory,
  ValuePaymentMethod,
} from '@/lib/marketplace/value-exchange/value-exchange-contract';

export const EXCHANGE_MATCHING_SPEC_VERSION = 1 as const;

/** What a listing offers (taxonomy + main category). */
export type ExchangeOfferModel = {
  mainCategory: ValueExchangeMainCategory;
  subcategoryIds: string[];
  /** Primary specialization for display, e.g. practical.repair */
  primarySubcategoryId: string | null;
  labelKey: string | null;
  listingKind: ListingKind;
  marketplaceCategory: MarketplaceCategory | null;
};

/** What a listing accepts in barter. */
export type ExchangeAcceptanceModel = {
  mainCategories: ValueExchangeMainCategory[];
  subcategoryIds: string[];
  barterOpenness: BarterOpenness;
  paymentMethod: ValuePaymentMethod;
};

/** Full exchange profile for one listing. */
export type ExchangeListingProfile = {
  listingId: string;
  userId: string;
  listingIntent: 'OFFER' | 'REQUEST';
  offer: ExchangeOfferModel;
  acceptance: ExchangeAcceptanceModel | null;
  desiredExchanges: DesiredExchangeDetail[];
  distanceKm: number | null;
  createdAt: string;
  expiresAt: string | null;
  availabilityDate: string | null;
  isActive: boolean;
  isDiscoverable: boolean;
  isBlocked: boolean;
};

export type ExchangeOverlapResult = {
  sharedMainCategories: ValueExchangeMainCategory[];
  sharedSubcategoryIds: string[];
  offerMatchesDesired: Array<{
    offerListingId: string;
    desiredListingId: string;
    subcategoryId: string;
  }>;
  mutualBarterReady: boolean;
};

export const FORBIDDEN_EXCHANGE_SCORE_SIGNALS = [
  'viewCount',
  'hcpPoints',
  'followerCount',
  'fansCount',
  'workspacePropsCount',
  'itemPropsCount',
  'blendedRating',
  'averageRating',
  'reputationScore',
  'feedRankBoost',
  'sponsoredBoost',
] as const;

export type ForbiddenExchangeScoreSignal =
  (typeof FORBIDDEN_EXCHANGE_SCORE_SIGNALS)[number];

export function exchangeProfileId(listingId: string): string {
  return `exchange-profile:${listingId}`;
}

export function exchangeMatchId(listingA: string, listingB: string): string {
  const sorted = [listingA, listingB].sort();
  return `exchange-match:${sorted[0]}:${sorted[1]}`;
}
