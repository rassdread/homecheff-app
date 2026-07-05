import type { MarketplaceCategory } from '@prisma/client';
import { MARKETPLACE_ENTRY_CATEGORY_KEY } from './i18n-keys';
import { normalizeAcceptedTaxonomyIds, normalizeTaxonomyIds } from './taxonomy-normalize';
import {
  getMarketplaceTaxonomyItem,
} from './taxonomy-resolve';
import type { TaxonomyTone } from './taxonomy-types';

export type ResolvedOfferBadge = {
  kind: 'taxonomy' | 'category';
  id: string;
  labelKey: string;
  icon: string;
  tone: TaxonomyTone;
};

const LEGACY_CATEGORY_META: Record<
  string,
  { labelKey: string; icon: string; tone: TaxonomyTone }
> = {
  CHEFF: { labelKey: 'productCategory.cheff', icon: 'ChefHat', tone: 'food' },
  GROWN: { labelKey: 'productCategory.garden', icon: 'Sprout', tone: 'garden' },
  DESIGNER: {
    labelKey: 'productCategory.designer',
    icon: 'Palette',
    tone: 'creative',
  },
};

const MARKETPLACE_CATEGORY_META: Record<
  MarketplaceCategory,
  { icon: string; tone: TaxonomyTone }
> = {
  CREATE: { icon: 'UtensilsCrossed', tone: 'food' },
  GROW: { icon: 'Sprout', tone: 'garden' },
  DESIGN: { icon: 'PenTool', tone: 'creative' },
  ARTISTIC_SERVICE: { icon: 'Sparkles', tone: 'artistic' },
  PRACTICAL_SERVICE: { icon: 'Wrench', tone: 'service' },
  KNOWLEDGE: { icon: 'GraduationCap', tone: 'knowledge' },
};

function resolveCategoryFallbackBadge(input: {
  marketplaceCategory?: MarketplaceCategory | null;
  legacyCategory?: string | null;
}): ResolvedOfferBadge {
  if (input.marketplaceCategory) {
    const meta = MARKETPLACE_CATEGORY_META[input.marketplaceCategory];
    return {
      kind: 'category',
      id: input.marketplaceCategory,
      labelKey: MARKETPLACE_ENTRY_CATEGORY_KEY[input.marketplaceCategory],
      icon: meta.icon,
      tone: meta.tone,
    };
  }

  const legacyKey = (input.legacyCategory ?? '').trim().toUpperCase();
  const legacyMeta = LEGACY_CATEGORY_META[legacyKey];
  if (legacyMeta) {
    return {
      kind: 'category',
      id: legacyKey,
      labelKey: legacyMeta.labelKey,
      icon: legacyMeta.icon,
      tone: legacyMeta.tone,
    };
  }

  return {
    kind: 'category',
    id: 'CHEFF',
    labelKey: LEGACY_CATEGORY_META.CHEFF.labelKey,
    icon: LEGACY_CATEGORY_META.CHEFF.icon,
    tone: LEGACY_CATEGORY_META.CHEFF.tone,
  };
}

/** Resolve offered taxonomy badges; legacy products get one category badge. */
export function resolveOfferBadges(input: {
  specializations?: unknown;
  marketplaceCategory?: MarketplaceCategory | null;
  legacyCategory?: string | null;
}): ResolvedOfferBadge[] {
  const taxonomyIds = normalizeTaxonomyIds(
    input.specializations,
    input.marketplaceCategory ?? null,
  );

  if (taxonomyIds.length > 0) {
    return taxonomyIds
      .map((id) => {
        const item = getMarketplaceTaxonomyItem(id);
        if (!item) return null;
        return {
          kind: 'taxonomy' as const,
          id,
          labelKey: item.labelKey,
          icon: item.icon,
          tone: item.tone,
        };
      })
      .filter((badge): badge is ResolvedOfferBadge => badge != null);
  }

  return [resolveCategoryFallbackBadge(input)];
}

export function resolveOfferBadgeByTaxonomyId(
  taxonomyId: string,
): ResolvedOfferBadge | null {
  const item = getMarketplaceTaxonomyItem(taxonomyId);
  if (!item) return null;
  return {
    kind: 'taxonomy',
    id: item.id,
    labelKey: item.labelKey,
    icon: item.icon,
    tone: item.tone,
  };
}

/** Resolve accepted-value taxonomy badges (no category fallback). */
export function resolveAcceptedBadges(raw: unknown): ResolvedOfferBadge[] {
  const ids = normalizeAcceptedTaxonomyIds(raw);
  return ids
    .map((id) => resolveOfferBadgeByTaxonomyId(id))
    .filter((badge): badge is ResolvedOfferBadge => badge != null);
}
