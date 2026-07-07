/**
 * Main offer-category badge for tile media overlay — Phase 5B-C.
 */

import { MAIN_CATEGORY_REGISTRY } from '@/lib/marketplace/value-exchange/main-categories';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import type { MarketplaceTileModel } from './types';

export type TileOfferCategoryBadge = {
  mainCategory: ValueExchangeMainCategory;
  labelKey: string;
  emoji: string;
};

export function resolveTileOfferCategoryBadge(
  model: MarketplaceTileModel,
): TileOfferCategoryBadge | null {
  if (model.mode === 'inspiration') {
    return null;
  }

  if (model.listingIntent === 'REQUEST' || model.listingKind === 'REQUEST') {
    const main = MAIN_CATEGORY_REGISTRY.REQUESTS;
    return {
      mainCategory: 'REQUESTS',
      labelKey: main.labelKey,
      emoji: main.emoji,
    };
  }

  const mainCategory = model.offerMainCategory as ValueExchangeMainCategory | null;
  if (!mainCategory || !MAIN_CATEGORY_REGISTRY[mainCategory]) {
    return null;
  }

  const entry = MAIN_CATEGORY_REGISTRY[mainCategory];
  if (entry.isFulfillmentChannel) return null;

  return {
    mainCategory,
    labelKey: entry.labelKey,
    emoji: entry.emoji,
  };
}
