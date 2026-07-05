import type { MarketplaceCategory, PriceModel } from '@prisma/client';
import { normalizeSpecializationSlug } from './listing-taxonomy';

export type MarketplaceFormFieldConfig = {
  showStock: boolean;
  showMaxStock: boolean;
  showAvailabilityDate: boolean;
  showSellerDelivery: boolean;
  stockLabelKey: string;
};

const WORKSHOP_SPECIALIZATIONS = new Set(['workshop', 'cookingclass', 'musicclass']);

const PHYSICAL_CREATE_SPECIALIZATIONS = new Set([
  'meal',
  'baking',
  'catering',
  'clothing',
  'jewelry',
  'decoration',
  'art',
]);

export function formFieldsForCategory(
  category: MarketplaceCategory,
  specializations?: string[] | null,
  legacySubcategory?: string | null,
): MarketplaceFormFieldConfig {
  const specs =
    specializations && specializations.length > 0
      ? specializations.map(normalizeSpecializationSlug)
      : legacySubcategory
        ? [normalizeSpecializationSlug(legacySubcategory)]
        : [];

  const isWorkshop =
    category === 'KNOWLEDGE' &&
    specs.some((s) => WORKSHOP_SPECIALIZATIONS.has(s));

  const isPhysicalProduct =
    category === 'CREATE' &&
    specs.some((s) => PHYSICAL_CREATE_SPECIALIZATIONS.has(s));

  const isService =
    category === 'ARTISTIC_SERVICE' ||
    category === 'PRACTICAL_SERVICE' ||
    category === 'KNOWLEDGE' ||
    category === 'DESIGN';

  if (isWorkshop) {
    return {
      showStock: true,
      showMaxStock: true,
      showAvailabilityDate: true,
      showSellerDelivery: false,
      stockLabelKey: 'marketplace.form.seatsAvailable',
    };
  }

  if (isPhysicalProduct || category === 'GROW') {
    return {
      showStock: true,
      showMaxStock: true,
      showAvailabilityDate: true,
      showSellerDelivery: true,
      stockLabelKey: 'marketplace.form.stock',
    };
  }

  if (isService) {
    return {
      showStock: false,
      showMaxStock: false,
      showAvailabilityDate: false,
      showSellerDelivery: false,
      stockLabelKey: 'marketplace.form.stock',
    };
  }

  return {
    showStock: false,
    showMaxStock: false,
    showAvailabilityDate: false,
    showSellerDelivery: false,
    stockLabelKey: 'marketplace.form.stock',
  };
}

export function priceRequiredForModel(model: PriceModel): boolean {
  return model === 'FIXED' || model === 'FROM_PRICE' || model === 'HOURLY' || model === 'DAILY';
}

export function allowsZeroPrice(model: PriceModel): boolean {
  return (
    model === 'ON_REQUEST' ||
    model === 'VOLUNTARY' ||
    model === 'FROM_PRICE'
  );
}
