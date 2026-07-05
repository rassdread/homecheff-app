import type { MarketplaceCategory, PriceModel } from '@prisma/client';

export type MarketplaceFormFieldConfig = {
  showStock: boolean;
  showMaxStock: boolean;
  showAvailabilityDate: boolean;
  showSellerDelivery: boolean;
  stockLabelKey: string;
};

const WORKSHOP_SUBCATEGORIES = new Set([
  'workshop',
  'cookingClass',
  'musicLesson',
]);

const PHYSICAL_CREATE_SUBCATEGORIES = new Set([
  'meals',
  'baking',
  'clothing',
  'jewelry',
  'decoration',
  'art',
]);

export function formFieldsForCategory(
  category: MarketplaceCategory,
  subcategory?: string | null,
): MarketplaceFormFieldConfig {
  const sub = subcategory ?? '';
  const isWorkshop =
    category === 'KNOWLEDGE' && WORKSHOP_SUBCATEGORIES.has(sub);

  const isPhysicalProduct =
    category === 'CREATE' && PHYSICAL_CREATE_SUBCATEGORIES.has(sub);

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
