/**
 * Canonical Marketplace Model — Phase 7D.
 *
 * The single, authoritative Information Architecture for the HomeCheff
 * marketplace. Three INDEPENDENT axes. No axis derives another; no surface may
 * invent a second truth.
 *
 *   AXIS 1 — INTENT (what does the user want?)     → discovery VIEW filter
 *   AXIS 2 — CATEGORY (what is it?)                → discovery CATEGORY filter
 *   AXIS 3 — SETTLEMENT (how is the deal closed?)  → follow-up flow ONLY
 *
 * Hard rules:
 *   • Services is a CATEGORY, never an intent.
 *   • "Offered" covers every value form (fixed / on-request / voluntary /
 *     barter-only / accepted-values-only / direct-contact-only / checkout).
 *   • Settlement never decides whether something is "Offered" and never filters.
 *
 * This module maps the canonical axes onto the EXISTING feed classifiers and
 * settlement helpers — it adds no new backend, ranking or fetch.
 */

import type { MarketplaceCategory } from '@prisma/client';
import type { FeedViewFilterId } from '@/lib/feed/feed-taxonomy';
import { feedVerticalSlugToCategoryEnum } from '@/lib/feed/feed-client-sort';
import {
  isMarketplaceSaleItem,
  isMarketplaceRequestItem,
  isMarketplaceServiceItem,
  type MarketplaceSaleInput,
} from '@/lib/feed/marketplace-sale';
import { marketplaceCategoryToMainCategory } from '@/lib/marketplace/value-exchange/category-taxonomy-map';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';

// ---------------------------------------------------------------------------
// AXIS 1 — INTENT (discovery VIEW)
// ---------------------------------------------------------------------------

export const MARKETPLACE_VIEW_INTENTS = [
  'ALL',
  'OFFERED',
  'WANTED',
  'INSPIRATION',
] as const;
export type MarketplaceViewIntent = (typeof MARKETPLACE_VIEW_INTENTS)[number];

/** Intent is NEVER a category. Services must not appear here. */
export const MARKETPLACE_VIEW_INTENT_LABEL_KEYS: Record<MarketplaceViewIntent, string> = {
  ALL: 'marketplace.canonical.view.all',
  OFFERED: 'marketplace.canonical.view.offered',
  WANTED: 'marketplace.canonical.view.wanted',
  INSPIRATION: 'marketplace.canonical.view.inspiration',
};

/** Map a canonical intent onto the existing legacy feed chip id (no rewire). */
export function viewIntentToLegacyFilter(
  intent: MarketplaceViewIntent,
): FeedViewFilterId {
  switch (intent) {
    case 'ALL':
      return 'all';
    case 'OFFERED':
      return 'sale';
    case 'WANTED':
      return 'gezocht';
    case 'INSPIRATION':
      return 'inspiration';
  }
}

// ---------------------------------------------------------------------------
// AXIS 2 — CATEGORY (discovery CATEGORY)
// ---------------------------------------------------------------------------

export const MARKETPLACE_CANONICAL_CATEGORIES = [
  'FOOD',
  'GARDEN',
  'CREATIONS',
  'SERVICES',
] as const;
export type MarketplaceCanonicalCategory =
  (typeof MARKETPLACE_CANONICAL_CATEGORIES)[number];

export const MARKETPLACE_CATEGORY_LABEL_KEYS: Record<MarketplaceCanonicalCategory, string> = {
  FOOD: 'marketplace.canonical.category.food',
  GARDEN: 'marketplace.canonical.category.garden',
  CREATIONS: 'marketplace.canonical.category.creations',
  SERVICES: 'marketplace.canonical.category.services',
};

/**
 * Collapse the existing 6-vertical main-category registry onto the 4 canonical
 * discovery categories. This is the ONLY bridge — it derives from the existing
 * `marketplaceCategoryToMainCategory` (single source), never a parallel table.
 *   HOME_CHEFF                       → FOOD
 *   HOME_GARDEN                      → GARDEN
 *   HOME_DESIGNER                    → CREATIONS
 *   SERVICES / WORKSHOPS / COACHING  → SERVICES
 */
export function mainCategoryToCanonical(
  main: ValueExchangeMainCategory,
): MarketplaceCanonicalCategory | null {
  switch (main) {
    case 'HOME_CHEFF':
      return 'FOOD';
    case 'HOME_GARDEN':
      return 'GARDEN';
    case 'HOME_DESIGNER':
      return 'CREATIONS';
    case 'SERVICES':
    case 'WORKSHOPS':
    case 'COACHING':
      return 'SERVICES';
    default:
      // DELIVERY (fulfillment channel) and REQUESTS (intent) are not categories.
      return null;
  }
}

/** Prisma MarketplaceCategory → canonical category. Subcategories stay taxonomy-driven. */
export function prismaCategoryToCanonical(
  marketplaceCategory: string | null | undefined,
  taxonomyId?: string | null,
): MarketplaceCanonicalCategory | null {
  const raw = String(marketplaceCategory ?? '').toUpperCase();
  if (!raw) return null;
  const main = marketplaceCategoryToMainCategory(
    raw as MarketplaceCategory,
    taxonomyId ?? null,
  );
  return mainCategoryToCanonical(main);
}

// ---------------------------------------------------------------------------
// AXIS 3 — SETTLEMENT (follow-up flow only — never filtering)
// ---------------------------------------------------------------------------

export const MARKETPLACE_SETTLEMENT_METHODS = [
  'HOMECHEFF_CHECKOUT',
  'DIRECT_CONTACT',
  'BARTER',
  'ALTERNATIVE_VALUES',
] as const;
export type MarketplaceSettlementMethod =
  (typeof MARKETPLACE_SETTLEMENT_METHODS)[number];

// ---------------------------------------------------------------------------
// Guards — enforce the axis separation in code (used by validators/tests).
// ---------------------------------------------------------------------------

/** Services is a category, so it can never be a view intent. */
export function isValidViewIntent(value: string): value is MarketplaceViewIntent {
  return (MARKETPLACE_VIEW_INTENTS as readonly string[]).includes(value);
}

export function isValidCanonicalCategory(
  value: string,
): value is MarketplaceCanonicalCategory {
  return (MARKETPLACE_CANONICAL_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Resolve the VIEW intent of an item from the EXISTING single-source
 * classifiers (no second truth). Settlement/price are irrelevant to this.
 */
export function resolveItemViewIntent(
  item: MarketplaceSaleInput,
): Exclude<MarketplaceViewIntent, 'ALL'> {
  if (isMarketplaceRequestItem(item)) return 'WANTED';
  if (isMarketplaceSaleItem(item)) return 'OFFERED';
  return 'INSPIRATION';
}

/**
 * Services is a CATEGORY that lives INSIDE the Offered view — a service is
 * always an offered item, never a competing intent. Proven by delegating to the
 * existing classifier which requires isMarketplaceSaleItem first.
 */
export function isServicesCategoryItem(item: MarketplaceSaleInput): boolean {
  return isMarketplaceServiceItem(item);
}

// ---------------------------------------------------------------------------
// Discovery filter UI — Phase 7E (VIEW + CATEGORY rows, no second logic)
// ---------------------------------------------------------------------------

/** Active view chips rendered in the UI. Services is intentionally absent. */
export const DISCOVERY_VIEW_CHIP_OPTIONS = MARKETPLACE_VIEW_INTENTS.map((intent) => ({
  intent,
  legacyChip: viewIntentToLegacyFilter(intent),
  labelKey: MARKETPLACE_VIEW_INTENT_LABEL_KEYS[intent],
}));

/** Category slugs mirror existing GeoFeed `appliedCategory` state (backward compat). */
export const DISCOVERY_CATEGORY_CHIP_OPTIONS = [
  { slug: 'all', labelKey: 'filters.all' as const },
  { slug: 'cheff', canonical: 'FOOD' as const, labelKey: MARKETPLACE_CATEGORY_LABEL_KEYS.FOOD },
  { slug: 'garden', canonical: 'GARDEN' as const, labelKey: MARKETPLACE_CATEGORY_LABEL_KEYS.GARDEN },
  {
    slug: 'designer',
    canonical: 'CREATIONS' as const,
    labelKey: MARKETPLACE_CATEGORY_LABEL_KEYS.CREATIONS,
  },
  {
    slug: 'services',
    canonical: 'SERVICES' as const,
    labelKey: MARKETPLACE_CATEGORY_LABEL_KEYS.SERVICES,
  },
] as const;

export type DiscoveryCategorySlug =
  (typeof DISCOVERY_CATEGORY_CHIP_OPTIONS)[number]['slug'];

const LEGACY_SERVICES_CHIP_ALIASES = new Set([
  'services',
  'service',
  'diensten',
  'dienst',
  'klussen',
]);

/** True for legacy `?chip=services` style deep links (view axis — migrated in 7E). */
export function isLegacyServicesViewChip(raw?: string | null): boolean {
  if (!raw?.trim()) return false;
  return LEGACY_SERVICES_CHIP_ALIASES.has(raw.trim().toLowerCase());
}

/** Category slug for the Services pillar (existing category-state value). */
export function isServicesCategorySlug(slug?: string | null): boolean {
  if (!slug?.trim()) return false;
  return LEGACY_SERVICES_CHIP_ALIASES.has(slug.trim().toLowerCase()) || slug === 'services';
}

/** Normalize server/URL/persisted category slugs onto discovery category state. */
export function normalizeDiscoveryCategorySlug(raw?: string | null): string {
  if (!raw?.trim()) return 'all';
  const v = raw.toLowerCase().trim();
  if (v === 'all') return 'all';
  if (v === 'cheff' || v === 'chef' || v === 'keuken' || v === 'food' || v === 'eten') {
    return 'cheff';
  }
  if (v === 'grown' || v === 'garden' || v === 'tuin') return 'garden';
  if (
    v === 'designer' ||
    v === 'design' ||
    v === 'studio' ||
    v === 'creations' ||
    v === 'creaties'
  ) {
    return 'designer';
  }
  if (isServicesCategorySlug(v)) return 'services';
  return 'all';
}

/**
 * Migrate legacy view chip `services` → Offered view + Services category.
 * Returns null when no migration is needed.
 */
export function migrateLegacyServicesViewChip(
  chip?: string | null,
  category?: string | null,
): { chip: FeedViewFilterId; category: string } | null {
  if (!isLegacyServicesViewChip(chip)) return null;
  const cat = normalizeDiscoveryCategorySlug(category);
  return {
    chip: 'sale',
    category: cat === 'all' ? 'services' : cat,
  };
}

export type DiscoveryCategoryMatchInput = MarketplaceSaleInput & {
  category?: string | null;
};

/**
 * Client-side category-axis filter — reuses existing classifiers (no second truth).
 * `getLegacyVerticalCategory` is injected to avoid a circular import with GeoFeed.
 */
export function itemMatchesDiscoveryCategorySlug(
  item: DiscoveryCategoryMatchInput,
  slug: string,
  getLegacyVerticalCategory?: (item: DiscoveryCategoryMatchInput) => string | null,
): boolean {
  const normalized = normalizeDiscoveryCategorySlug(slug);
  if (normalized === 'all') return true;
  if (normalized === 'services') return isMarketplaceServiceItem(item);
  const enumCat = feedVerticalSlugToCategoryEnum(normalized);
  if (!enumCat || !getLegacyVerticalCategory) return true;
  return getLegacyVerticalCategory(item) === enumCat;
}

