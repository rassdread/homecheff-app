/**
 * Marketplace tile presentation model — not used for ranking.
 * @see docs/audits/MARKETPLACE_TILE_ARCHITECTURE.md
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DiscoveryTrustBadge } from '@/lib/discovery/contracts/discovery-read-model';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';

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

  /** Phase 5B-A — derived for future tile icon surfaces (not rendered yet). */
  offerMainCategory?: ValueExchangeMainCategory | null;
  offerSubCategory?: string | null;
  offerSubCategoryIcon?: string | null;
  acceptedValueCategories?: ValueExchangeMainCategory[];
  acceptedValueSubcategories?: string[];

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

export type TileBadgeIconKind = 'lucide' | 'emoji' | 'none';

export type TileBadge = {
  kind: TileBadgeKind;
  label: string;
  tone: TileBadgeTone;
  /** Canonical taxonomy dot-id when badge is registry-backed */
  taxonomyId?: string | null;
  icon?: string;
  iconKind?: TileBadgeIconKind;
  taxonomyTone?: TaxonomyTone | null;
};

/** Reserved for Phase 5B+ barter badge row — not rendered in 5B-B */
export type TileBarterRenderSlot = {
  reserved: true;
  barterOpenness: string | null;
  hasAcceptedValues: boolean;
};

export type BuildTileBadgesResult = {
  badges: TileBadge[];
  overflowCount: number;
  /** Extensibility hook for barter badges; UI wiring deferred */
  barterSlot?: TileBarterRenderSlot;
};

export type TileTrustCue = {
  segments: string[];
};

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;
