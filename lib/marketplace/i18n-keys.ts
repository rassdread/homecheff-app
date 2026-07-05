import type { MarketplaceCategory, PriceModel } from '@prisma/client';
import type { FulfillmentOptionKey } from './listing-taxonomy';

export const MARKETPLACE_CATEGORY_KEY: Record<MarketplaceCategory, string> = {
  CREATE: 'marketplace.categories.create',
  GROW: 'marketplace.categories.grow',
  DESIGN: 'marketplace.categories.design',
  ARTISTIC_SERVICE: 'marketplace.categories.artisticService',
  PRACTICAL_SERVICE: 'marketplace.categories.practicalService',
  KNOWLEDGE: 'marketplace.categories.knowledge',
};

const SUBCATEGORY_NS: Record<MarketplaceCategory, string> = {
  CREATE: 'create',
  GROW: 'grow',
  DESIGN: 'design',
  ARTISTIC_SERVICE: 'artisticService',
  PRACTICAL_SERVICE: 'practicalService',
  KNOWLEDGE: 'knowledge',
};

export function subcategoryI18nKey(
  category: MarketplaceCategory,
  slug: string,
): string {
  return `marketplace.subcategories.${SUBCATEGORY_NS[category]}.${slug}`;
}

export const PRICE_MODEL_KEY: Record<PriceModel, string> = {
  FIXED: 'marketplace.priceModel.fixed',
  ON_REQUEST: 'marketplace.priceModel.onRequest',
  FROM_PRICE: 'marketplace.priceModel.fromPrice',
  HOURLY: 'marketplace.priceModel.hourly',
  DAILY: 'marketplace.priceModel.daily',
  VOLUNTARY: 'marketplace.priceModel.voluntary',
};

export const FULFILLMENT_I18N_KEY: Record<FulfillmentOptionKey, string> = {
  pickup: 'marketplace.fulfillment.pickup',
  delivery: 'marketplace.fulfillment.delivery',
  shipping: 'marketplace.fulfillment.shipping',
  digital: 'marketplace.fulfillment.digital',
  onSiteClient: 'marketplace.fulfillment.onSiteClient',
  onSiteProvider: 'marketplace.fulfillment.onSiteProvider',
};

export const MARKETPLACE_ERROR_KEYS = {
  paymentMethodRequired: 'marketplace.errors.paymentMethodRequired',
  titleDescriptionRequired: 'marketplace.errors.titleDescriptionRequired',
  photosRequired: 'marketplace.errors.photosRequired',
  invalidPrice: 'marketplace.errors.invalidPrice',
  placeNameRequired: 'marketplace.errors.placeNameRequired',
  locationRequired: 'marketplace.errors.locationRequired',
  saveFailed: 'marketplace.errors.saveFailed',
  invalidFields: 'marketplace.errors.invalidFields',
  validPhotoUrlRequired: 'marketplace.errors.validPhotoUrlRequired',
  priceInvalidContact: 'marketplace.errors.priceInvalidContact',
  priceMissingOrInvalid: 'marketplace.errors.priceMissingOrInvalid',
} as const;
