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
  fansCount?: number;
  viewerIsFan?: boolean;
};

import type { BusinessPlanId } from '@/lib/business/visibility-profile';

export type MarketplaceTileTrust = {
  productReviewCount: number;
  dealReviewCount: number;
  courierReviewCount: number;
  completedDeals: number;
  completedDeliveries: number;
  repeatCustomers: number;
  trustBadges: DiscoveryTrustBadge[];
  sellerTier: number;
  businessPlan?: BusinessPlanId;
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
  /** Ordered product photos for inline feed carousel (cover first when present). */
  galleryUrls?: string[];
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

  /** Phase 7C — real settlement booleans (preferred over orderMethod). */
  acceptsHomeCheffCheckout: boolean;
  acceptsDirectContact: boolean;
  /** Seller's Stripe Connect payout profile is ready (public checkout gate). */
  homeCheffCheckoutConfigured: boolean;

  person: MarketplaceTilePerson | null;
  /** Legal/subscription classification. Company name alone does not set this. */
  sellerRole?: 'business' | 'private';
  companyName?: string | null;
  place: string | null;
  /** sales_location is a public stall, never the private residence. */
  placeKind?: 'sales_location' | 'area' | null;
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
  isFavorited?: boolean;

  /** Phase 5B-A — derived value-exchange presentation fields. */
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
  | 'offer_category'
  | 'specialization'
  | 'accepted_value'
  | 'trust_badge'
  | 'business_plan';

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
  /** Paid plan id for business_plan badges (Basic / Pro / Premium styling). */
  businessPlan?: BusinessPlanId;
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
