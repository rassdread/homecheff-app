/**
 * Marketplace Value Exchange System — Phase 4A contracts.
 * Canonical types for what is offered, payment, barter acceptance, and desired exchange.
 * @see docs/architecture/MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md
 */

import type { BarterOpenness, MarketplaceCategory, PriceModel } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';

/** Eight user-facing main categories (icon taxonomy). */
export const VALUE_EXCHANGE_MAIN_CATEGORIES = [
  'HOME_CHEFF',
  'HOME_GARDEN',
  'HOME_DESIGNER',
  'SERVICES',
  'WORKSHOPS',
  'COACHING',
  'DELIVERY',
  'REQUESTS',
] as const;

export type ValueExchangeMainCategory =
  (typeof VALUE_EXCHANGE_MAIN_CATEGORIES)[number];

/** Canonical payment / settlement methods. */
export const VALUE_PAYMENT_METHODS = [
  'MONEY',
  'BARTER',
  'MONEY_AND_BARTER',
  'VOLUNTARY_CONTRIBUTION',
  'ON_REQUEST',
] as const;

export type ValuePaymentMethod = (typeof VALUE_PAYMENT_METHODS)[number];

/** Surface tiers for icon display density. */
export const VALUE_EXCHANGE_SURFACE_TIERS = [
  'tile',
  'preview',
  'detail',
] as const;

export type ValueExchangeSurfaceTier =
  (typeof VALUE_EXCHANGE_SURFACE_TIERS)[number];

export type MainCategoryContract = {
  id: ValueExchangeMainCategory;
  emoji: string;
  labelKey: string;
  icon: string;
  /** Lucide icon name for UI without emoji. */
  lucideIcon: string;
  /** Maps to Prisma MarketplaceCategory when applicable. */
  marketplaceCategories: MarketplaceCategory[];
  /** ListingKind override when kind drives classification. */
  listingKinds: ListingKind[];
  /** Fulfillment-only category (no taxonomy items). */
  isFulfillmentChannel?: boolean;
  /** Request intent — not an offer vertical. */
  isRequestIntent?: boolean;
};

export type ValuePaymentMethodContract = {
  id: ValuePaymentMethod;
  emoji: string;
  labelKey: string;
  icon: string;
  barterOpenness: BarterOpenness[];
  priceModels: PriceModel[];
  tilePriceKey: string;
};

/** Categories accepted in barter (main-category icons only on tile). */
export type BarterAcceptanceModel = {
  /** Main category ids the seller accepts as alternative value. */
  acceptedMainCategories: ValueExchangeMainCategory[];
  /** Resolved taxonomy ids (subcategories) — detail/preview only. */
  acceptedTaxonomyIds: string[];
  /** BarterOpenness from listing. */
  openness: BarterOpenness;
};

/** What the counterparty desires in return (requests + barter detail). */
export type DesiredExchangeDetail = {
  mainCategory: ValueExchangeMainCategory;
  /** Canonical taxonomy id, e.g. artistic.portrait */
  subcategoryId: string;
  subcategoryLabelKey: string;
  description: string;
};

export type ValueExchangeListingContext = {
  listingKind: ListingKind;
  listingIntent: 'OFFER' | 'REQUEST';
  marketplaceCategory: MarketplaceCategory | null;
  specializationIds: string[];
  acceptedTaxonomyIds: string[];
  paymentMethod: ValuePaymentMethod;
  barterAcceptance: BarterAcceptanceModel | null;
  desiredExchange: DesiredExchangeDetail | null;
};

export const FORBIDDEN_VALUE_EXCHANGE_EFFECTS = [
  'feed_rank_boost',
  'trust_tier_boost',
  'discovery_section_boost',
  'sponsored_placement',
  'recommendation_ml_boost',
] as const;

export type FutureExchangeCapability =
  | 'barter_matching'
  | 'exchange_recommendations'
  | 'multi_party_exchanges'
  | 'community_exchange_chains';

export const FUTURE_EXCHANGE_CAPABILITIES: FutureExchangeCapability[] = [
  'barter_matching',
  'exchange_recommendations',
  'multi_party_exchanges',
  'community_exchange_chains',
];
