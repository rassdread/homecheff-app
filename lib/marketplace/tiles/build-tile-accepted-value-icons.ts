/**
 * Accepted-value subcategory icons for tile value row — Phase 5B-C.
 * Subcategory-first with parent main-category fallback.
 */

import { MAIN_CATEGORY_REGISTRY } from '@/lib/marketplace/value-exchange/main-categories';
import { marketplaceCategoryToMainCategory } from '@/lib/marketplace/value-exchange/category-taxonomy-map';
import { resolveOfferBadgeByTaxonomyId } from '@/lib/marketplace/taxonomy-badges';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import {
  resolveMainCategoryTone,
} from '@/lib/marketplace/marketplace-icon-colors';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
import type { TileBadgeVariant } from './tile-badge-priority';
import type { MarketplaceTileModel, TranslateFn } from './types';

export type TileAcceptedValueIcon = {
  taxonomyId: string;
  icon: string;
  iconKind: 'lucide' | 'emoji';
  taxonomyTone?: import('@/lib/marketplace/taxonomy-types').TaxonomyTone | null;
  ariaLabel: string;
  tooltipLabel: string;
};

export type TileAcceptedValueIconsResult = {
  icons: TileAcceptedValueIcon[];
  overflowCount: number;
};

export const ACCEPTED_VALUE_ICON_MAX: Record<TileBadgeVariant, number> = {
  compact: 2,
  standard: 4,
  mini: 1,
  sidebar: 2,
};

function resolveAcceptedTaxonomyIds(model: MarketplaceTileModel): string[] {
  const fromSubcategories = model.acceptedValueSubcategories ?? [];
  if (fromSubcategories.length > 0) return fromSubcategories;

  const fromSpecs = model.acceptedSpecializations.filter((id) => {
    const item = getMarketplaceTaxonomyItem(id);
    return !!item;
  });
  if (fromSpecs.length > 0) return fromSpecs;

  const categories = model.acceptedValueCategories ?? [];
  return categories.map((main) => `main:${main}`);
}

function resolveIconForTaxonomyId(
  taxonomyId: string,
): { icon: string; iconKind: 'lucide' | 'emoji' } | null {
  if (taxonomyId.startsWith('main:')) {
    const mainId = taxonomyId.slice(5) as keyof typeof MAIN_CATEGORY_REGISTRY;
    const main = MAIN_CATEGORY_REGISTRY[mainId];
    if (!main) return null;
    return { icon: main.emoji, iconKind: 'emoji' };
  }

  const registry = resolveOfferBadgeByTaxonomyId(taxonomyId);
  if (registry?.icon) {
    return { icon: registry.icon, iconKind: 'lucide' };
  }

  const item = getMarketplaceTaxonomyItem(taxonomyId);
  if (item?.icon) {
    return { icon: item.icon, iconKind: 'lucide' };
  }

  if (item) {
    const main = marketplaceCategoryToMainCategory(item.category, item.id);
    const mainEntry = MAIN_CATEGORY_REGISTRY[main];
    if (mainEntry) {
      return { icon: mainEntry.emoji, iconKind: 'emoji' };
    }
  }

  return null;
}

function resolveToneForTaxonomyId(taxonomyId: string): TaxonomyTone | null {
  if (taxonomyId.startsWith('main:')) {
    const mainId = taxonomyId.slice(5) as ValueExchangeMainCategory;
    if (mainId in MAIN_CATEGORY_REGISTRY) {
      return resolveMainCategoryTone(mainId);
    }
    return null;
  }
  const registry = resolveOfferBadgeByTaxonomyId(taxonomyId);
  if (registry?.tone) return registry.tone;
  const item = getMarketplaceTaxonomyItem(taxonomyId);
  if (item?.tone) return item.tone;
  if (item) {
    const main = marketplaceCategoryToMainCategory(item.category, item.id);
    return resolveMainCategoryTone(main);
  }
  return null;
}

function resolveLabelKey(taxonomyId: string): string {
  if (taxonomyId.startsWith('main:')) {
    const mainId = taxonomyId.slice(5) as keyof typeof MAIN_CATEGORY_REGISTRY;
    return MAIN_CATEGORY_REGISTRY[mainId]?.labelKey ?? taxonomyId;
  }
  const registry = resolveOfferBadgeByTaxonomyId(taxonomyId);
  if (registry?.labelKey) return registry.labelKey;
  const item = getMarketplaceTaxonomyItem(taxonomyId);
  return item?.labelKey ?? taxonomyId;
}

export function buildTileAcceptedValueIcons(
  model: MarketplaceTileModel,
  t: TranslateFn,
  variant: TileBadgeVariant,
): TileAcceptedValueIconsResult | null {
  if (model.mode === 'inspiration') return null;

  const ids = resolveAcceptedTaxonomyIds(model);
  if (ids.length === 0) return null;

  const max = ACCEPTED_VALUE_ICON_MAX[variant];
  const icons: TileAcceptedValueIcon[] = [];

  for (const taxonomyId of ids) {
    const resolved = resolveIconForTaxonomyId(taxonomyId);
    if (!resolved) continue;
    const labelKey = resolveLabelKey(taxonomyId);
    const name = t(labelKey);
    icons.push({
      taxonomyId,
      icon: resolved.icon,
      iconKind: resolved.iconKind,
      taxonomyTone: resolveToneForTaxonomyId(taxonomyId),
      ariaLabel: t('marketplace.tile.acceptedValues.aria', { name }),
      tooltipLabel: name,
    });
  }

  if (icons.length === 0) return null;

  const visible = icons.slice(0, max);
  return {
    icons: visible,
    overflowCount: Math.max(0, icons.length - max),
  };
}
