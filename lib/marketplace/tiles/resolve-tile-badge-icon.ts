/**
 * Tile badge icon resolution — Phase 5B-B.
 * Priority: subcategory icon → taxonomy registry → main category → generic.
 */

import type { MarketplaceCategory } from '@prisma/client';
import { MAIN_CATEGORY_REGISTRY } from '@/lib/marketplace/value-exchange/main-categories';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import {
  resolveOfferBadgeByTaxonomyId,
  resolveOfferBadges,
} from '@/lib/marketplace/taxonomy-badges';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
import type { MarketplaceTileModel, TileBadgeIconKind } from './types';

export type ResolvedTileTaxonomyBadge = {
  taxonomyId: string | null;
  labelKey: string;
  icon: string;
  iconKind: TileBadgeIconKind;
  taxonomyTone: TaxonomyTone | null;
};

const GENERIC_ICON = 'Tag';

export function resolveTileOfferTaxonomyBadge(
  model: MarketplaceTileModel,
): ResolvedTileTaxonomyBadge | null {
  if (model.mode === 'inspiration') {
    return null;
  }

  const primaryId =
    model.offerSubCategory ?? model.specializations[0] ?? null;

  if (primaryId) {
    const fromRegistry = resolveOfferBadgeByTaxonomyId(primaryId);
    if (fromRegistry) {
      return {
        taxonomyId: fromRegistry.id,
        labelKey: fromRegistry.labelKey,
        icon: model.offerSubCategoryIcon ?? fromRegistry.icon,
        iconKind: 'lucide',
        taxonomyTone: fromRegistry.tone,
      };
    }
  }

  const normalized = resolveOfferBadges({
    specializations: model.specializations,
    marketplaceCategory: model.marketplaceCategory as MarketplaceCategory | null,
    legacyCategory: null,
  });
  const first = normalized[0];
  if (first?.kind === 'taxonomy') {
    return {
      taxonomyId: first.id,
      labelKey: first.labelKey,
      icon: model.offerSubCategoryIcon ?? first.icon,
      iconKind: 'lucide',
      taxonomyTone: first.tone,
    };
  }

  const mainCategory = model.offerMainCategory as ValueExchangeMainCategory | null;
  if (mainCategory && MAIN_CATEGORY_REGISTRY[mainCategory]) {
    const main = MAIN_CATEGORY_REGISTRY[mainCategory];
    return {
      taxonomyId: null,
      labelKey: main.labelKey,
      icon: main.lucideIcon,
      iconKind: 'lucide',
      taxonomyTone: null,
    };
  }

  if (model.marketplaceCategory) {
    const cat = model.marketplaceCategory as MarketplaceCategory;
    const badges = resolveOfferBadges({
      specializations: [],
      marketplaceCategory: cat,
      legacyCategory: null,
    });
    const fallback = badges[0];
    if (fallback) {
      return {
        taxonomyId: fallback.kind === 'taxonomy' ? fallback.id : null,
        labelKey: fallback.labelKey,
        icon: fallback.icon,
        iconKind: 'lucide',
        taxonomyTone: fallback.tone,
      };
    }
  }

  return {
    taxonomyId: null,
    labelKey: MAIN_CATEGORY_REGISTRY.HOME_CHEFF.labelKey,
    icon: GENERIC_ICON,
    iconKind: 'lucide',
    taxonomyTone: null,
  };
}

export function resolveTileAcceptedTaxonomyBadges(
  model: MarketplaceTileModel,
): ResolvedTileTaxonomyBadge[] {
  const ids =
    model.acceptedValueSubcategories?.length
      ? model.acceptedValueSubcategories
      : model.acceptedSpecializations;

  return ids
    .map((id) => resolveOfferBadgeByTaxonomyId(id))
    .filter((badge): badge is NonNullable<typeof badge> => badge != null)
    .map((badge) => ({
      taxonomyId: badge.id,
      labelKey: badge.labelKey,
      icon: badge.icon,
      iconKind: 'lucide' as const,
      taxonomyTone: badge.tone,
    }));
}
