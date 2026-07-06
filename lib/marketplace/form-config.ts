import type { MarketplaceCategory } from '@prisma/client';
import { getMarketplaceTaxonomyItem } from './taxonomy-resolve';
import { toCanonicalTaxonomyId } from './taxonomy-normalize';

export type MarketplaceFormFieldConfig = {
  showStock: boolean;
  showMaxStock: boolean;
  showAvailabilityDate: boolean;
  showSellerDelivery: boolean;
  stockLabelKey: string;
};

const WORKSHOP_TAXONOMY_IDS = new Set([
  'knowledge.workshop',
  'knowledge.cookingclass',
  'knowledge.musicclass',
]);

const PHYSICAL_CREATE_TAXONOMY_IDS = new Set([
  'create.meal',
  'create.baking',
  'create.bread',
  'create.cake',
  'create.cupcakes',
  'create.cookies',
  'create.soup',
  'create.pasta',
  'create.rice',
  'create.catering',
  'create.bbq',
  'create.cuisine_surinamese',
  'create.cuisine_indonesian',
  'create.cuisine_caribbean',
  'create.clothing',
  'create.jewelry',
  'create.decoration',
  'create.art',
]);

function resolveSpecIds(
  specializations?: string[] | null,
  legacySubcategory?: string | null,
): string[] {
  if (specializations && specializations.length > 0) {
    return specializations;
  }
  if (legacySubcategory?.trim()) {
    const canonical = toCanonicalTaxonomyId(legacySubcategory);
    return canonical ? [canonical] : [];
  }
  return [];
}

export function isWorkshopTaxonomyId(id: string): boolean {
  return WORKSHOP_TAXONOMY_IDS.has(id);
}

export function isPhysicalCreateTaxonomyId(id: string): boolean {
  return PHYSICAL_CREATE_TAXONOMY_IDS.has(id);
}

export function formFieldsForCategory(
  category: MarketplaceCategory,
  specializations?: string[] | null,
  legacySubcategory?: string | null,
): MarketplaceFormFieldConfig {
  const specs = resolveSpecIds(specializations, legacySubcategory).filter((id) =>
    getMarketplaceTaxonomyItem(id),
  );

  const isWorkshop =
    category === 'KNOWLEDGE' && specs.some((id) => isWorkshopTaxonomyId(id));

  const isPhysicalProduct =
    category === 'CREATE' && specs.some((id) => isPhysicalCreateTaxonomyId(id));

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

export function priceRequiredForModel(model: import('@prisma/client').PriceModel): boolean {
  return model === 'FIXED' || model === 'FROM_PRICE' || model === 'HOURLY' || model === 'DAILY';
}

export function allowsZeroPrice(model: import('@prisma/client').PriceModel): boolean {
  return (
    model === 'ON_REQUEST' ||
    model === 'VOLUNTARY' ||
    model === 'FROM_PRICE'
  );
}
