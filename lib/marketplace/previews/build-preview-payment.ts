import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';
import { isContactOnlyProduct } from '@/lib/product/order-method';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import type { PreviewPaymentBlock } from './types';

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function buildPreviewPaymentBlock(
  model: MarketplaceTileModel,
  t: TranslateFn,
): PreviewPaymentBlock | null {
  if (model.mode === 'inspiration') {
    if (!model.inspirationCategoryLabel) return null;
    return {
      primary: model.inspirationCategoryLabel,
      secondary: t('marketplace.preview.payment.inspiration'),
    };
  }

  if (model.listingIntent === 'REQUEST') {
    if ((model.priceCents ?? 0) > 0) {
      return {
        primary: t('marketplace.tile.price.budget', {
          price: formatEuro(model.priceCents!),
        }),
        secondary: t('marketplace.preview.payment.requestBudget'),
      };
    }
    const openness = String(model.barterOpenness ?? '').toUpperCase();
    if (openness === 'VOLUNTARY') {
      return {
        primary: t('marketplace.tile.price.requestVoluntary'),
        secondary: t('marketplace.preview.payment.voluntary'),
      };
    }
    return {
      primary: t('marketplace.tile.price.requestWelcome'),
      secondary: t('marketplace.preview.payment.requestOpen'),
    };
  }

  const openness = String(model.barterOpenness ?? '').toUpperCase();
  if (openness === 'BARTER_ONLY') {
    return {
      primary: t('marketplace.tile.price.barterOnly'),
      secondary: t('marketplace.preview.payment.barterOnly'),
    };
  }

  let primary = getMarketplacePriceDisplay(
    {
      priceCents: model.priceCents,
      priceModel: model.priceModel,
      orderMethod: model.orderMethod,
      acceptedSpecializations: model.acceptedSpecializations,
    },
    t,
  );

  if (openness === 'MONEY_AND_BARTER' && (model.priceCents ?? 0) > 0) {
    primary = t('marketplace.tile.price.moneyAndBarter', {
      price: formatEuro(model.priceCents!),
    });
  }

  let secondary: string | null = null;
  const priceModel = String(model.priceModel ?? 'FIXED').toUpperCase();

  if (priceModel === 'FIXED' && (model.priceCents ?? 0) > 0) {
    secondary = t('marketplace.preview.payment.fixed');
  } else if (priceModel === 'ON_REQUEST' || isContactOnlyProduct(model)) {
    secondary = t('marketplace.preview.payment.onRequest');
  } else if (priceModel === 'VOLUNTARY') {
    secondary = t('marketplace.preview.payment.voluntary');
  } else if (openness === 'MONEY_AND_BARTER') {
    secondary = t('marketplace.preview.payment.moneyAndBarter');
  } else if (
    (model.acceptedSpecializations?.length ?? 0) > 0 &&
    (model.priceCents ?? 0) === 0
  ) {
    secondary = t('marketplace.preview.payment.alternativeValue');
  }

  if (!primary) return null;
  return { primary, secondary };
}
