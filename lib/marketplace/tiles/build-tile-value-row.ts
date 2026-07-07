/**
 * Compact value row — price label + money/barter indicators (Phase 5B-C).
 */

import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';
import type { MarketplaceTileModel, TranslateFn } from './types';

export type TileValueRowData = {
  priceLabel: string;
  showMoneyIndicator: boolean;
  showBarterIndicator: boolean;
};

function formatEuroAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function hasAcceptedValues(model: MarketplaceTileModel): boolean {
  return (
    (model.acceptedValueSubcategories?.length ?? 0) > 0 ||
    model.acceptedSpecializations.length > 0
  );
}

function openness(model: MarketplaceTileModel): string {
  return String(model.barterOpenness ?? 'MONEY').toUpperCase();
}

function buildRequestValueRow(
  model: MarketplaceTileModel,
  t: TranslateFn,
): TileValueRowData | null {
  const open = openness(model);
  const accepted = hasAcceptedValues(model);

  if ((model.priceCents ?? 0) > 0) {
    return {
      priceLabel: t('marketplace.tile.valueRow.requestBudget', {
        price: formatEuroAmount(model.priceCents!),
      }),
      showMoneyIndicator: true,
      showBarterIndicator: open === 'MONEY_AND_BARTER' || open === 'BARTER_ONLY' || accepted,
    };
  }

  if (open === 'VOLUNTARY') {
    return {
      priceLabel: t('marketplace.tile.valueRow.voluntary'),
      showMoneyIndicator: false,
      showBarterIndicator: true,
    };
  }

  if (open === 'BARTER_ONLY' || accepted) {
    return {
      priceLabel: t('marketplace.tile.valueRow.barterOpen'),
      showMoneyIndicator: false,
      showBarterIndicator: true,
    };
  }

  if (open === 'MONEY_AND_BARTER') {
    return {
      priceLabel: t('marketplace.tile.valueRow.proposalWelcome'),
      showMoneyIndicator: true,
      showBarterIndicator: true,
    };
  }

  return {
    priceLabel: t('marketplace.tile.valueRow.proposalWelcome'),
    showMoneyIndicator: false,
    showBarterIndicator: false,
  };
}

/**
 * Returns null when nothing meaningful should render (no empty row).
 */
export function buildTileValueRow(
  model: MarketplaceTileModel,
  t: TranslateFn,
): TileValueRowData | null {
  if (model.mode === 'inspiration') {
    const label = model.inspirationCategoryLabel?.trim();
    return label ? { priceLabel: label, showMoneyIndicator: false, showBarterIndicator: false } : null;
  }

  if (model.listingIntent === 'REQUEST') {
    return buildRequestValueRow(model, t);
  }

  const open = openness(model);
  const accepted = hasAcceptedValues(model);
  const priceCents = model.priceCents ?? 0;

  if (open === 'BARTER_ONLY') {
    return {
      priceLabel: t('marketplace.tile.valueRow.barterOpen'),
      showMoneyIndicator: false,
      showBarterIndicator: true,
    };
  }

  let priceLabel = getMarketplacePriceDisplay(
    {
      priceCents: model.priceCents,
      priceModel: model.priceModel,
      orderMethod: model.orderMethod,
      acceptedSpecializations: model.acceptedSpecializations,
    },
    t,
  );

  if (open === 'MONEY_AND_BARTER' && priceCents > 0) {
    priceLabel = formatEuroAmount(priceCents);
  }

  const showMoneyIndicator =
    open === 'MONEY' ||
    open === 'MONEY_AND_BARTER' ||
    priceCents > 0 ||
    model.priceModel === 'ON_REQUEST' ||
    model.priceModel === 'FROM_PRICE';

  const showBarterIndicator =
    open === 'MONEY_AND_BARTER' || open === 'BARTER_ONLY' || accepted;

  if (!priceLabel.trim() && !showMoneyIndicator && !showBarterIndicator) {
    return null;
  }

  return {
    priceLabel: priceLabel.trim() || t('marketplace.tile.valueRow.onRequest'),
    showMoneyIndicator,
    showBarterIndicator,
  };
}
