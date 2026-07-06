/**
 * Compact single-line price / value display for marketplace tiles.
 */

import { isContactOnlyProduct } from '@/lib/product/order-method';
import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { formatWorkshopDateCompact } from './format-workshop-date';
import type { MarketplaceTileModel, TranslateFn } from './types';

function formatEuroAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function kindSuffixKey(kind: ListingKind): string | null {
  switch (kind) {
    case 'SERVICE':
      return 'marketplace.tile.kind.service';
    case 'TASK':
      return 'marketplace.tile.kind.task';
    case 'WORKSHOP':
      return 'marketplace.tile.kind.workshop';
    case 'COACHING':
      return 'marketplace.tile.kind.coaching';
    default:
      return null;
  }
}

function hasWorkshopDateBadge(model: MarketplaceTileModel): boolean {
  return model.listingKind === 'WORKSHOP' && Boolean(model.availabilityDate);
}

export function buildTilePriceLine(
  model: MarketplaceTileModel,
  t: TranslateFn,
): string {
  if (model.mode === 'inspiration') {
    return model.inspirationCategoryLabel ?? '';
  }

  if (model.listingIntent === 'REQUEST') {
    if ((model.priceCents ?? 0) > 0) {
      return t('marketplace.tile.price.budget', {
        price: formatEuroAmount(model.priceCents!),
      });
    }
    const openness = String(model.barterOpenness ?? '').toUpperCase();
    if (openness === 'VOLUNTARY') {
      return t('marketplace.tile.price.requestVoluntary');
    }
    return t('marketplace.tile.price.requestWelcome');
  }

  const openness = String(model.barterOpenness ?? '').toUpperCase();
  if (openness === 'BARTER_ONLY') {
    return t('marketplace.tile.price.barterOnly');
  }

  let line = getMarketplacePriceDisplay(
    {
      priceCents: model.priceCents,
      priceModel: model.priceModel,
      orderMethod: model.orderMethod,
      acceptedSpecializations: model.acceptedSpecializations,
    },
    t,
  );

  if (openness === 'MONEY_AND_BARTER' && (model.priceCents ?? 0) > 0) {
    line = t('marketplace.tile.price.moneyAndBarter', {
      price: formatEuroAmount(model.priceCents!),
    });
  }

  if (model.listingIntent !== 'REQUEST' && isContactOnlyProduct(model)) {
    line = `${line} · ${t('productOrder.badgeViaContact')}`;
  }

  const suffixKey = kindSuffixKey(model.listingKind);
  if (suffixKey && model.listingKind !== 'PRODUCT') {
    line = `${line} · ${t(suffixKey)}`;
  }

  if (
    model.listingKind === 'WORKSHOP' &&
    model.availabilityDate &&
    !hasWorkshopDateBadge(model)
  ) {
    line = `${line} · ${formatWorkshopDateCompact(model.availabilityDate)}`;
  }

  return line;
}
