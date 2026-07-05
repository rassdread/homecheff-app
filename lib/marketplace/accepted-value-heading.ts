import type { PriceModel } from '@prisma/client';
import { hasPublicDisplayPrice } from '@/lib/product/order-method';

const VALID_PRICE_MODELS: PriceModel[] = [
  'FIXED',
  'ON_REQUEST',
  'FROM_PRICE',
  'HOURLY',
  'DAILY',
  'VOLUNTARY',
];

function resolvePriceModel(raw?: PriceModel | string | null): PriceModel {
  const key = String(raw ?? 'FIXED')
    .trim()
    .toUpperCase();
  return VALID_PRICE_MODELS.includes(key as PriceModel)
    ? (key as PriceModel)
    : 'FIXED';
}

export type AcceptedValueHeadingInput = {
  priceCents?: number | null;
  priceModel?: PriceModel | string | null;
};

/** i18n key for accepted-value section heading on cards and detail. */
export function resolveAcceptedValueHeadingKey(
  product: AcceptedValueHeadingInput,
): 'marketplace.badges.acceptsAlsoHeading' | 'marketplace.badges.acceptsOnlyHeading' {
  const model = resolvePriceModel(product.priceModel);
  if (model === 'ON_REQUEST' || model === 'VOLUNTARY') {
    return 'marketplace.badges.acceptsOnlyHeading';
  }
  if (!hasPublicDisplayPrice(product)) {
    return 'marketplace.badges.acceptsOnlyHeading';
  }
  return 'marketplace.badges.acceptsAlsoHeading';
}

/** @deprecated Use resolveAcceptedValueHeadingKey — kept for spec naming */
export function resolveAcceptedValueHeading(
  product: AcceptedValueHeadingInput,
): string {
  return resolveAcceptedValueHeadingKey(product);
}
