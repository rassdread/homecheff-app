/**
 * Marketplace price labels by priceModel (V2/V3). Legacy: missing priceModel → FIXED.
 */

import type { PriceModel } from '@prisma/client';
import { isContactOnlyProduct } from '@/lib/product/order-method';

export type MarketplacePriceDisplayInput = {
  priceCents?: number | null;
  priceModel?: PriceModel | string | null;
  orderMethod?: string | null;
};

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

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

function formatEuroAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function getMarketplacePriceDisplay(
  product: MarketplacePriceDisplayInput,
  t: TranslateFn,
): string {
  const model = resolvePriceModel(product.priceModel);
  const cents = product.priceCents ?? 0;

  switch (model) {
    case 'ON_REQUEST':
      return t('marketplace.priceDisplay.onRequest');
    case 'VOLUNTARY':
      return t('marketplace.priceDisplay.voluntary');
    case 'FROM_PRICE':
      if (cents > 0) {
        return t('marketplace.priceDisplay.from', {
          price: formatEuroAmount(cents),
        });
      }
      return t('marketplace.priceDisplay.onRequest');
    case 'HOURLY':
      if (cents > 0) {
        return t('marketplace.priceDisplay.hourly', {
          price: formatEuroAmount(cents),
        });
      }
      return t('marketplace.priceDisplay.onRequest');
    case 'DAILY':
      if (cents > 0) {
        return t('marketplace.priceDisplay.daily', {
          price: formatEuroAmount(cents),
        });
      }
      return t('marketplace.priceDisplay.onRequest');
    case 'FIXED':
    default:
      if (cents > 0) {
        return formatEuroAmount(cents);
      }
      if (isContactOnlyProduct(product)) {
        return t('marketplace.priceDisplay.onRequest');
      }
      return t('marketplace.priceDisplay.onRequest');
  }
}
