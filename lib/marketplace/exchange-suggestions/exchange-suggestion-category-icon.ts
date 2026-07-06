/**
 * Main category icon mapping for exchange suggestion surfaces — Phase 4G.
 */

import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import { MAIN_CATEGORY_REGISTRY } from '@/lib/marketplace/value-exchange/main-categories';

export function mainCategoryEmoji(
  category: ValueExchangeMainCategory,
): string {
  return MAIN_CATEGORY_REGISTRY[category]?.emoji ?? '🍳';
}

export function mainCategoryLabelKey(
  category: ValueExchangeMainCategory,
): string {
  return MAIN_CATEGORY_REGISTRY[category]?.labelKey ?? MAIN_CATEGORY_REGISTRY.HOME_CHEFF.labelKey;
}
