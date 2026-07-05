import type {
  BarterOpenness,
  ListingIntent,
  MarketplaceCategory,
  PriceModel,
  ProductOrderMethod,
} from '@prisma/client';
import {
  deriveOrderMethodFromPaymentFlags,
  marketplaceToLegacyApiCategory,
  marketplaceToProductCategory,
  normalizeSpecializations,
  parseFulfillmentOptions,
  primarySpecialization,
  type FulfillmentOptions,
  type ListingIntentValue,
} from './listing-taxonomy';
import {
  fulfillmentToLegacyDeliveryMode,
} from './fulfillment';
import { allowsZeroPrice, priceRequiredForModel } from './form-config';
import { MARKETPLACE_ERROR_KEYS } from './i18n-keys';

export type MarketplaceV2Payload = {
  listingIntent: ListingIntent;
  marketplaceCategory: MarketplaceCategory;
  subcategory: string | null;
  specializations: string[];
  priceModel: PriceModel;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  fulfillmentOptions: FulfillmentOptions;
  barterOpenness: BarterOpenness | null;
  placeName: string | null;
  useProfileLocation: boolean;
  /** Derived legacy fields */
  category: 'CHEFF' | 'GARDEN' | 'DESIGNER';
  productCategory: ReturnType<typeof marketplaceToProductCategory>;
  deliveryMode: string;
  orderMethod: ProductOrderMethod;
  priceCents: number;
};

export function parseMarketplaceV2FromBody(
  body: Record<string, unknown>,
  priceCentsNum: number,
): MarketplaceV2Payload {
  const listingIntent = (
    body.listingIntent === 'REQUEST' ? 'REQUEST' : 'OFFER'
  ) as ListingIntent;

  const marketplaceCategory = parseMarketplaceCategory(body.marketplaceCategory);

  const priceModel = parsePriceModel(body.priceModel);

  const acceptHomeCheffPayment =
    body.acceptHomeCheffPayment !== false &&
    body.acceptHomeCheffPayment !== 'false';
  const acceptDirectContact =
    body.acceptDirectContact === true || body.acceptDirectContact === 'true';

  const fulfillmentOptions = parseFulfillmentOptions(
    body.fulfillmentOptions ?? body.fulfillment,
  );

  const barterOpenness = parseBarterOpenness(body.barterOpenness);

  const useProfileLocation =
    body.useProfileLocation !== false && body.useProfileLocation !== 'false';

  const placeName =
    typeof body.placeName === 'string' ? body.placeName.trim() || null : null;

  const orderMethod =
    body.orderMethod !== undefined
      ? (String(body.orderMethod) === 'CONTACT' ? 'CONTACT' : 'HOMECHEFF_PAYMENT')
      : deriveOrderMethodFromPaymentFlags({
          acceptHomeCheffPayment,
          acceptDirectContact,
        });

  const subcategoryRaw =
    typeof body.subcategory === 'string' ? body.subcategory.trim() || null : null;

  const specializations = normalizeSpecializations(
    body.specializations ?? (subcategoryRaw ? [subcategoryRaw] : []),
    marketplaceCategory,
  );

  const subcategory =
    primarySpecialization(specializations) ?? subcategoryRaw;

  const deliveryMode =
    typeof body.deliveryMode === 'string' && body.deliveryMode.includes(',')
      ? body.deliveryMode
      : fulfillmentToLegacyDeliveryMode(fulfillmentOptions);

  return {
    listingIntent,
    marketplaceCategory,
    subcategory,
    specializations,
    priceModel,
    acceptHomeCheffPayment: acceptHomeCheffPayment || (!acceptDirectContact),
    acceptDirectContact,
    fulfillmentOptions,
    barterOpenness,
    placeName,
    useProfileLocation,
    category: marketplaceToLegacyApiCategory(marketplaceCategory),
    productCategory: marketplaceToProductCategory(marketplaceCategory),
    deliveryMode,
    orderMethod,
    priceCents: priceCentsNum,
  };
}

function parseMarketplaceCategory(raw: unknown): MarketplaceCategory {
  const s = String(raw ?? 'CREATE').toUpperCase();
  const map: Record<string, MarketplaceCategory> = {
    CREATE: 'CREATE',
    CHEFF: 'CREATE',
    GROW: 'GROW',
    GROWN: 'GROW',
    GARDEN: 'GROW',
    DESIGN: 'DESIGN',
    DESIGNER: 'DESIGN',
    ARTISTIC_SERVICE: 'ARTISTIC_SERVICE',
    PRACTICAL_SERVICE: 'PRACTICAL_SERVICE',
    KNOWLEDGE: 'KNOWLEDGE',
  };
  return map[s] ?? 'CREATE';
}

function parsePriceModel(raw: unknown): PriceModel {
  const s = String(raw ?? 'FIXED').toUpperCase();
  const valid: PriceModel[] = [
    'FIXED',
    'ON_REQUEST',
    'FROM_PRICE',
    'HOURLY',
    'DAILY',
    'VOLUNTARY',
  ];
  return valid.includes(s as PriceModel) ? (s as PriceModel) : 'FIXED';
}

function parseBarterOpenness(raw: unknown): BarterOpenness | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).toUpperCase();
  if (s === 'MONEY') return 'MONEY';
  if (s === 'MONEY_AND_BARTER') return 'MONEY_AND_BARTER';
  if (s === 'BARTER_ONLY') return 'BARTER_ONLY';
  return null;
}

export function validateMarketplacePrice(
  priceModel: PriceModel,
  priceCents: number,
  acceptHomeCheffPayment: boolean,
  acceptDirectContact: boolean,
): { ok: true } | { ok: false; errorKey: string } {
  if (!acceptHomeCheffPayment && !acceptDirectContact) {
    return {
      ok: false,
      errorKey: MARKETPLACE_ERROR_KEYS.paymentMethodRequired,
    };
  }

  if (priceModel === 'ON_REQUEST' || priceModel === 'VOLUNTARY') {
    return { ok: true };
  }

  if (allowsZeroPrice(priceModel) && priceCents === 0) {
    return { ok: true };
  }

  if (priceRequiredForModel(priceModel) && priceCents <= 0 && acceptHomeCheffPayment) {
    return {
      ok: false,
      errorKey: MARKETPLACE_ERROR_KEYS.invalidPrice,
    };
  }

  if (!acceptHomeCheffPayment && acceptDirectContact) {
    return { ok: true };
  }

  return { ok: true };
}

export function parseListingIntent(raw: unknown): ListingIntentValue {
  return raw === 'REQUEST' ? 'REQUEST' : 'OFFER';
}
