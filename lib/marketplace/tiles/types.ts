/**
 * Marketplace tile presentation model — not used for ranking.
 * @see docs/audits/MARKETPLACE_TILE_ARCHITECTURE.md
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DiscoveryTrustBadge } from '@/lib/discovery/contracts/discovery-read-model';

export type MarketplaceTileMode = 'sale' | 'inspiration';

export type MarketplaceTileMediaRatio = '4:5' | '1:1' | '4:3';

export type MarketplaceTileVariant = 'compact' | 'standard' | 'mini' | 'sidebar';

export type MarketplaceTileFulfillmentMode =
  | 'pickup'
  | 'delivery'
  | 'both'
  | 'digital'
  | 'on_site'
  | null;

export type MarketplaceTilePerson = {
  userId: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
};

export type MarketplaceTileTrust = {
  productReviewCount: number;
  dealReviewCount: number;
  courierReviewCount: number;
  completedDeals: number;
  completedDeliveries: number;
  repeatCustomers: number;
  trustBadges: DiscoveryTrustBadge[];
  sellerTier: number;
};

export type MarketplaceTileFulfillmentFlags = {
  pickup: boolean;
  delivery: boolean;
  shipping: boolean;
  digital: boolean;
  onSite: boolean;
  onlineSession: boolean;
};

/** Presentation-only view model for discovery tiles. */
export type MarketplaceTileModel = {
  id: string;
  href: string;
  entityType: 'product' | 'dish' | 'listing' | 'workspace';
  title: string;
  description: string | null;

  coverImage: string | null;
  videoUrl: string | null;
  videoPoster: string | null;
  imageAlt: string;

  listingKind: ListingKind;
  listingIntent: 'OFFER' | 'REQUEST' | null;
  marketplaceCategory: string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  availabilityDate: string | null;

  priceCents: number | null;
  priceModel: string | null;
  orderMethod: string | null;

  person: MarketplaceTilePerson | null;
  place: string | null;
  distanceKm: number | null;

  trust: MarketplaceTileTrust;
  favoriteCount: number;
  fulfillmentMode: MarketplaceTileFulfillmentMode;
  fulfillmentFlags: MarketplaceTileFulfillmentFlags;

  /** Workshop capacity — only when present on discovery transport (future). */
  capacityRemaining: number | null;
  /** Request needed-by — uses availabilityDate when set. */
  neededBy: string | null;

  mode: MarketplaceTileMode;
  inspirationCategoryLabel?: string;

  sponsored?: false;
};

export type TileBadgeKind =
  | 'sponsored'
  | 'request'
  | 'workshop_date'
  | 'listing_kind'
  | 'specialization'
  | 'accepted_value'
  | 'trust_badge';

export type TileBadgeTone = 'request' | 'default' | 'date' | 'trust' | 'kind';

export type TileBadge = {
  kind: TileBadgeKind;
  label: string;
  tone: TileBadgeTone;
};

export type TileTrustCue = {
  segments: string[];
};

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;
