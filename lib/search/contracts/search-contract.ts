/**
 * Canonical search contract — shared by feed, Dorpsplein, profile, future Discovery.
 * @see docs/audits/SEARCH_ARCHITECTURE_AUDIT.md
 */

import type { BarterOpenness, MarketplaceCategory } from '@prisma/client';
import type {
  ListingKind,
  MarketplaceListingKind,
} from '@/lib/marketplace/contracts/listing-kind-contract';

/** Entity types returned by marketplace search APIs. */
export type SearchResultEntityType =
  | 'product'
  | 'dish'
  | 'listing'
  | 'user';

/** Unified search filter params (query string + structured filters). */
export type SearchFilterParams = {
  q?: string | null;
  /** Comma-separated or array — filter only, no ranking. */
  listingKind?: ListingKind | ListingKind[] | null;
  listingIntent?: 'OFFER' | 'REQUEST' | null;
  marketplaceCategory?: MarketplaceCategory | MarketplaceCategory[] | null;
  /** Any specialization id may match (OR). */
  specializations?: string[] | null;
  barterOpenness?: BarterOpenness | BarterOpenness[] | null;
  /** Legacy vertical — parallel to marketplaceCategory, not a kind substitute. */
  legacyCategory?: string | null;
};

/** Classification block attached to every searchable listing result. */
export type SearchResultClassification = {
  listingKind: ListingKind;
  listingIntent: 'OFFER' | 'REQUEST' | null;
  marketplaceCategory: MarketplaceCategory | string | null;
  specializations: string[];
  entityType: SearchResultEntityType;
};

import type { DiscoveryReadModel } from '@/lib/discovery/contracts/discovery-read-model';

/** Minimum shape for filter + text matching helpers. */
export type SearchableListingRecord = {
  title?: string | null;
  description?: string | null;
  listingKind?: ListingKind | null;
  listingIntent?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  category?: string | null;
  barterOpenness?: string | null;
  feedSource?: string | null;
  type?: string | null;
  entityType?: SearchResultEntityType | null;
  /** Phase 1C: when present, search uses discovery fields without re-derivation. */
  discovery?: DiscoveryReadModel | null;
  /** Optional seller fields for Dorpsplein text search. */
  seller?: {
    name?: string | null;
    username?: string | null;
  } | null;
  location?: {
    place?: string | null;
    city?: string | null;
  } | null;
};

export type SearchQueryIntentHint = {
  /** ListingKinds suggested by query wording — filter assist, not ranking. */
  listingKindHints: MarketplaceListingKind[];
  /** True when query wording suggests help-seeking (Gezocht). */
  suggestsRequest: boolean;
};

export const SEARCH_LISTING_KINDS = [
  'PRODUCT',
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
  'REQUEST',
  'INSPIRATION',
] as const satisfies readonly ListingKind[];
