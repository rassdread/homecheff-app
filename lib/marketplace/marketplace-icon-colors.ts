/**
 * Marketplace icon color SSOT — Phase 13M.
 * Lucide icon names stay in taxonomy / main-categories registries.
 * This module owns foreground, chip, and settlement icon colors only.
 */

import type { TaxonomyTone } from './taxonomy-types';
import type { ValueExchangeMainCategory } from './value-exchange/value-exchange-contract';

/** Richer Lucide foreground per taxonomy tone (subcategories inherit parent tone). */
export const TAXONOMY_TONE_ICON_CLASSES: Record<TaxonomyTone, string> = {
  food: 'text-orange-700',
  garden: 'text-emerald-700',
  creative: 'text-purple-700',
  artistic: 'text-pink-700',
  service: 'text-sky-700',
  knowledge: 'text-amber-700',
  international: 'text-indigo-700',
  blocked: 'text-neutral-500',
};

/** Main category → taxonomy tone (subcategory icons inherit this). */
export const MAIN_CATEGORY_TONE: Record<ValueExchangeMainCategory, TaxonomyTone> = {
  HOME_CHEFF: 'food',
  HOME_GARDEN: 'garden',
  HOME_DESIGNER: 'creative',
  SERVICES: 'service',
  WORKSHOPS: 'international',
  COACHING: 'knowledge',
  DELIVERY: 'service',
  REQUESTS: 'food',
};

/** Main category Lucide accent (when not using full taxonomy tone). */
export const MAIN_CATEGORY_ICON_CLASSES: Record<ValueExchangeMainCategory, string> = {
  HOME_CHEFF: TAXONOMY_TONE_ICON_CLASSES.food,
  HOME_GARDEN: TAXONOMY_TONE_ICON_CLASSES.garden,
  HOME_DESIGNER: TAXONOMY_TONE_ICON_CLASSES.creative,
  SERVICES: TAXONOMY_TONE_ICON_CLASSES.service,
  WORKSHOPS: TAXONOMY_TONE_ICON_CLASSES.international,
  COACHING: TAXONOMY_TONE_ICON_CLASSES.knowledge,
  DELIVERY: 'text-cyan-700',
  REQUESTS: TAXONOMY_TONE_ICON_CLASSES.knowledge,
};

export type SettlementIconId =
  | 'homecheff'
  | 'directContact'
  | 'barter'
  | 'acceptedValues';

export const SETTLEMENT_ICON_COLOR: Record<SettlementIconId, string> = {
  homecheff: 'text-emerald-700',
  directContact: 'text-stone-600',
  barter: 'text-amber-700',
  acceptedValues: 'text-teal-700',
};

export const SETTLEMENT_ICON_SIZE = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
} as const;

/** Legacy Prisma vertical chips (CHEFF / GROWN / DESIGNER). */
export const LEGACY_VERTICAL_CHIP_CLASSES = {
  CHEFF: 'bg-orange-100 text-orange-800 hover:bg-orange-200/90',
  GROWN: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200/90',
  DESIGNER: 'bg-purple-100 text-purple-800 hover:bg-purple-200/90',
} as const;

export const LEGACY_VERTICAL_ICON_CLASSES = {
  CHEFF: TAXONOMY_TONE_ICON_CLASSES.food,
  GROWN: TAXONOMY_TONE_ICON_CLASSES.garden,
  DESIGNER: TAXONOMY_TONE_ICON_CLASSES.creative,
} as const;

/** Detail / listing hero category accents (icon + badge text). */
export const LEGACY_VERTICAL_DETAIL_CLASSES = {
  CHEFF: {
    text: TAXONOMY_TONE_ICON_CLASSES.food,
    badge: 'bg-orange-100 text-orange-900 border-orange-300/80',
    accent: 'bg-orange-600',
  },
  GROWN: {
    text: TAXONOMY_TONE_ICON_CLASSES.garden,
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300/80',
    accent: 'bg-emerald-600',
  },
  DESIGNER: {
    text: TAXONOMY_TONE_ICON_CLASSES.creative,
    badge: 'bg-purple-100 text-purple-900 border-purple-300/80',
    accent: 'bg-purple-600',
  },
} as const;

/** Discovery feed vertical slug → icon class. */
export const DISCOVERY_VERTICAL_ICON_CLASSES: Record<string, string> = {
  cheff: LEGACY_VERTICAL_ICON_CLASSES.CHEFF,
  garden: LEGACY_VERTICAL_ICON_CLASSES.GROWN,
  designer: LEGACY_VERTICAL_ICON_CLASSES.DESIGNER,
  services: TAXONOMY_TONE_ICON_CLASSES.service,
};

export function resolveTaxonomyIconClass(
  tone?: TaxonomyTone | null,
  fallback = 'text-stone-600',
): string {
  if (!tone) return fallback;
  return TAXONOMY_TONE_ICON_CLASSES[tone] ?? fallback;
}

export function resolveMainCategoryIconClass(
  main: ValueExchangeMainCategory,
): string {
  return MAIN_CATEGORY_ICON_CLASSES[main];
}

export function settlementIconClass(id: SettlementIconId): string {
  return SETTLEMENT_ICON_COLOR[id];
}

export function resolveMainCategoryTone(
  main: ValueExchangeMainCategory,
): TaxonomyTone {
  return MAIN_CATEGORY_TONE[main];
}
