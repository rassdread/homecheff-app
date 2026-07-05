import type {
  MarketplaceCategory,
  PriceModel,
  ProductCategory,
  ProductOrderMethod,
} from '@prisma/client';

export type ListingIntentValue = 'OFFER' | 'REQUEST';

export type FulfillmentOptionKey =
  | 'pickup'
  | 'delivery'
  | 'shipping'
  | 'digital'
  | 'onSiteClient'
  | 'onSiteProvider';

export type FulfillmentOptions = Record<FulfillmentOptionKey, boolean>;

export const FULFILLMENT_KEYS: FulfillmentOptionKey[] = [
  'pickup',
  'delivery',
  'shipping',
  'digital',
  'onSiteClient',
  'onSiteProvider',
];

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'CREATE',
  'GROW',
  'DESIGN',
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
];

/** Subcategory slugs — labels via i18n (`marketplace.subcategories.*`). */
export const SUBCATEGORIES: Record<MarketplaceCategory, string[]> = {
  CREATE: [
    'meals',
    'baking',
    'clothing',
    'jewelry',
    'decoration',
    'art',
    'other',
  ],
  GROW: ['vegetables', 'fruit', 'herbs', 'plants', 'honey', 'other'],
  DESIGN: [
    'logo',
    'website',
    'app',
    'video',
    'photo',
    'illustration',
    'marketing',
    'other',
  ],
  ARTISTIC_SERVICE: [
    'tattoo',
    'airbrush',
    'bodypaint',
    'mural',
    'illustration',
    'portrait',
    'music',
    'other',
  ],
  PRACTICAL_SERVICE: [
    'gardening',
    'cleaning',
    'movingHelp',
    'computerHelp',
    'handyman',
    'other',
  ],
  KNOWLEDGE: [
    'workshop',
    'cookingClass',
    'musicLesson',
    'tutoring',
    'coaching',
    'other',
  ],
};

/** Map legacy sell URL category to V2 marketplace category */
export function legacyUrlCategoryToMarketplace(
  cat: 'CHEFF' | 'GARDEN' | 'DESIGNER' | string | null | undefined,
): MarketplaceCategory {
  if (cat === 'GARDEN') return 'GROW';
  if (cat === 'DESIGNER') return 'DESIGN';
  return 'CREATE';
}

/** Map V2 category → legacy ProductCategory for feed/checkout compatibility */
export function marketplaceToProductCategory(
  cat: MarketplaceCategory,
): ProductCategory {
  switch (cat) {
    case 'GROW':
      return 'GROWN';
    case 'DESIGN':
    case 'ARTISTIC_SERVICE':
      return 'DESIGNER';
    case 'CREATE':
    case 'PRACTICAL_SERVICE':
    case 'KNOWLEDGE':
    default:
      return 'CHEFF';
  }
}

/** Legacy API category string (CHEFF/GARDEN/DESIGNER) from marketplace category */
export function marketplaceToLegacyApiCategory(
  cat: MarketplaceCategory,
): 'CHEFF' | 'GARDEN' | 'DESIGNER' {
  switch (cat) {
    case 'GROW':
      return 'GARDEN';
    case 'DESIGN':
    case 'ARTISTIC_SERVICE':
      return 'DESIGNER';
    default:
      return 'CHEFF';
  }
}

export function defaultFulfillmentForCategory(
  cat: MarketplaceCategory,
): FulfillmentOptions {
  switch (cat) {
    case 'DESIGN':
      return {
        pickup: false,
        delivery: false,
        shipping: false,
        digital: true,
        onSiteClient: false,
        onSiteProvider: false,
      };
    case 'KNOWLEDGE':
      return {
        pickup: false,
        delivery: false,
        shipping: false,
        digital: false,
        onSiteClient: false,
        onSiteProvider: true,
      };
    case 'PRACTICAL_SERVICE':
      return {
        pickup: false,
        delivery: false,
        shipping: false,
        digital: false,
        onSiteClient: true,
        onSiteProvider: false,
      };
    case 'ARTISTIC_SERVICE':
      return {
        pickup: false,
        delivery: false,
        shipping: false,
        digital: false,
        onSiteClient: true,
        onSiteProvider: true,
      };
    case 'GROW':
    case 'CREATE':
    default:
      return {
        pickup: true,
        delivery: false,
        shipping: false,
        digital: false,
        onSiteClient: false,
        onSiteProvider: false,
      };
  }
}

export const PRICE_MODELS: PriceModel[] = [
  'FIXED',
  'ON_REQUEST',
  'FROM_PRICE',
  'HOURLY',
  'DAILY',
  'VOLUNTARY',
];

export function deriveOrderMethodFromPaymentFlags(input: {
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
}): ProductOrderMethod {
  if (input.acceptHomeCheffPayment) return 'HOMECHEFF_PAYMENT';
  if (input.acceptDirectContact) return 'CONTACT';
  return 'HOMECHEFF_PAYMENT';
}

export function emptyFulfillmentOptions(): FulfillmentOptions {
  return {
    pickup: false,
    delivery: false,
    shipping: false,
    digital: false,
    onSiteClient: false,
    onSiteProvider: false,
  };
}

export function parseFulfillmentOptions(raw: unknown): FulfillmentOptions {
  const base = emptyFulfillmentOptions();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  for (const key of FULFILLMENT_KEYS) {
    if (o[key] === true) base[key] = true;
  }
  return base;
}

export function fulfillmentIsDigitalOnly(opts: FulfillmentOptions): boolean {
  return (
    opts.digital &&
    !opts.pickup &&
    !opts.delivery &&
    !opts.shipping &&
    !opts.onSiteClient &&
    !opts.onSiteProvider
  );
}
