/**
 * Tile settlement row — Phase 7B.
 *
 * Answers "how can the agreement be settled?" — kept STRICTLY separate from the
 * value row (price + accepted-value subcategory icons). Each affordance is a
 * distinct icon so the money/checkout icon never conflates with cash or barter:
 *
 *   - homecheffCheckout : safe pay via HomeCheff (NOT a money-bill icon)
 *   - directContact     : cash / direct arrangement
 *   - barter            : barter allowed
 *   - acceptedValues    : alternative values (tegenwaarden) welcome
 *
 * Pure + derived only from the existing tile model (no extra fetch).
 */

import type { MarketplaceTileModel } from './types';

export type TileSettlementRowData = {
  homecheffCheckout: boolean;
  directContact: boolean;
  barter: boolean;
  acceptedValues: boolean;
};

function hasAcceptedValues(model: MarketplaceTileModel): boolean {
  return (
    (model.acceptedValueSubcategories?.length ?? 0) > 0 ||
    model.acceptedSpecializations.length > 0
  );
}

/**
 * Returns null when there is nothing meaningful to render (no empty row).
 *
 * NOTE: `orderMethod` is a single derived value today (HOMECHEFF_PAYMENT |
 * CONTACT). A listing that accepts BOTH cannot yet show both icons — that
 * requires the two `acceptHomeCheffPayment` / `acceptDirectContact` booleans in
 * the feed payload (documented as deferred in the Phase 7B audit).
 */
export function buildTileSettlementRow(
  model: MarketplaceTileModel,
): TileSettlementRowData | null {
  if (model.mode === 'inspiration') return null;

  const order = String(model.orderMethod ?? '').toUpperCase();
  const openness = String(model.barterOpenness ?? 'MONEY').toUpperCase();

  const homecheffCheckout = order === 'HOMECHEFF_PAYMENT';
  const directContact = order === 'CONTACT';
  const barter = openness === 'MONEY_AND_BARTER' || openness === 'BARTER_ONLY';
  const acceptedValues = hasAcceptedValues(model);

  if (!homecheffCheckout && !directContact && !barter && !acceptedValues) {
    return null;
  }

  return { homecheffCheckout, directContact, barter, acceptedValues };
}
