/**
 * Main category registry — Phase 4A.
 * Maps user-facing icon taxonomy to marketplace taxonomy and listing kinds.
 */

import type { MainCategoryContract } from './value-exchange-contract';
import { VALUE_EXCHANGE_MAIN_CATEGORIES } from './value-exchange-contract';

const KEY = 'marketplace.valueExchange.categories';

export const MAIN_CATEGORY_REGISTRY: Record<
  (typeof VALUE_EXCHANGE_MAIN_CATEGORIES)[number],
  MainCategoryContract
> = {
  HOME_CHEFF: {
    id: 'HOME_CHEFF',
    emoji: '🍳',
    labelKey: `${KEY}.homeCheff`,
    icon: '🍳',
    lucideIcon: 'UtensilsCrossed',
    marketplaceCategories: ['CREATE'],
    listingKinds: ['PRODUCT'],
  },
  HOME_GARDEN: {
    id: 'HOME_GARDEN',
    emoji: '🌱',
    labelKey: `${KEY}.homeGarden`,
    icon: '🌱',
    lucideIcon: 'Sprout',
    marketplaceCategories: ['GROW'],
    listingKinds: ['PRODUCT'],
  },
  HOME_DESIGNER: {
    id: 'HOME_DESIGNER',
    emoji: '🎨',
    labelKey: `${KEY}.homeDesigner`,
    icon: '🎨',
    lucideIcon: 'Palette',
    marketplaceCategories: ['DESIGN', 'ARTISTIC_SERVICE'],
    listingKinds: ['SERVICE'],
  },
  SERVICES: {
    id: 'SERVICES',
    emoji: '🔧',
    labelKey: `${KEY}.services`,
    icon: '🔧',
    lucideIcon: 'Wrench',
    marketplaceCategories: ['PRACTICAL_SERVICE'],
    listingKinds: ['SERVICE', 'TASK'],
  },
  WORKSHOPS: {
    id: 'WORKSHOPS',
    emoji: '📚',
    labelKey: `${KEY}.workshops`,
    icon: '📚',
    lucideIcon: 'GraduationCap',
    marketplaceCategories: ['KNOWLEDGE'],
    listingKinds: ['WORKSHOP'],
  },
  COACHING: {
    id: 'COACHING',
    emoji: '🎓',
    labelKey: `${KEY}.coaching`,
    icon: '🎓',
    lucideIcon: 'HeartHandshake',
    marketplaceCategories: ['KNOWLEDGE'],
    listingKinds: ['COACHING'],
  },
  DELIVERY: {
    id: 'DELIVERY',
    emoji: '🚚',
    labelKey: `${KEY}.delivery`,
    icon: '🚚',
    lucideIcon: 'Truck',
    marketplaceCategories: [],
    listingKinds: [],
    isFulfillmentChannel: true,
  },
  REQUESTS: {
    id: 'REQUESTS',
    emoji: '🙋',
    labelKey: `${KEY}.requests`,
    icon: '🙋',
    lucideIcon: 'Hand',
    marketplaceCategories: [],
    listingKinds: ['REQUEST'],
    isRequestIntent: true,
  },
};

export function getMainCategory(
  id: (typeof VALUE_EXCHANGE_MAIN_CATEGORIES)[number],
): MainCategoryContract {
  return MAIN_CATEGORY_REGISTRY[id];
}

export function listMainCategories(): MainCategoryContract[] {
  return VALUE_EXCHANGE_MAIN_CATEGORIES.map((id) => MAIN_CATEGORY_REGISTRY[id]);
}

export function mainCategoriesForOfferVertical(): MainCategoryContract[] {
  return listMainCategories().filter(
    (c) => !c.isFulfillmentChannel && !c.isRequestIntent,
  );
}
