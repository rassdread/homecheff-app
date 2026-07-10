/**
 * Tile settlement row — Phase 7B (icons) + 7C (canonical, multi-option).
 *
 * Answers "how can the agreement be settled?" — kept STRICTLY separate from the
 * value row (price + accepted-value subcategory icons). Each affordance is a
 * distinct icon so the money/checkout icon never conflates with cash or barter:
 *
 *   - homecheffCheckout : safe pay via HomeCheff (NOT a money-bill icon) — only
 *                         shown when publicly available (Connect configured)
 *   - directContact     : cash / direct arrangement
 *   - barter            : barter allowed
 *   - acceptedValues    : alternative values (tegenwaarden) welcome
 *
 * A listing can now show MULTIPLE icons at once (e.g. HomeCheff Checkout +
 * Direct contact + Barter), driven by the canonical settlement options resolved
 * from the real `acceptHomeCheffPayment` / `acceptDirectContact` booleans (with
 * legacy `orderMethod` fallback). Pure + derived from the tile model — no fetch.
 */

import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import type { MarketplaceTileModel } from './types';

export type TileSettlementRowData = {
  homecheffCheckout: boolean;
  directContact: boolean;
  barter: boolean;
  acceptedValues: boolean;
};

/**
 * Returns null when there is nothing meaningful to render (no empty row).
 *
 * HomeCheff Checkout is shown ONLY when it is publicly available now
 * (`canCheckoutNow` — seller selected it AND Stripe Connect is configured). A
 * seller who selected HomeCheff Checkout but has not finished Connect is guided
 * in create/edit/detail, but their tile does not advertise checkout publicly.
 */
export function buildTileSettlementRow(
  model: MarketplaceTileModel,
): TileSettlementRowData | null {
  if (model.mode === 'inspiration') return null;

  const options = resolveSettlementOptions({
    // Canonical booleans populated by the feed/profile mappers; fall back to
    // orderMethod for legacy fixtures/rows that never set them.
    acceptHomeCheffPayment:
      typeof model.acceptsHomeCheffCheckout === 'boolean'
        ? model.acceptsHomeCheffCheckout
        : undefined,
    acceptDirectContact:
      typeof model.acceptsDirectContact === 'boolean'
        ? model.acceptsDirectContact
        : undefined,
    orderMethod: model.orderMethod,
    barterOpenness: model.barterOpenness,
    acceptedSpecializations: model.acceptedSpecializations,
    acceptedValueSubcategories: model.acceptedValueSubcategories,
    priceCents: model.priceCents,
    priceModel: model.priceModel,
    listingIntent: model.listingIntent,
    stripeConnectReady: model.homeCheffCheckoutConfigured === false
      ? false
      : model.homeCheffCheckoutConfigured === true
        ? true
        : undefined,
  });

  const homecheffCheckout = options.canCheckoutNow;
  const directContact =
    options.acceptsDirectContact || options.homeCheffCheckoutNeedsConnect;
  const barter = options.allowsBarter;
  const acceptedValues = options.hasAcceptedValues;

  if (!homecheffCheckout && !directContact && !barter && !acceptedValues) {
    return null;
  }

  return { homecheffCheckout, directContact, barter, acceptedValues };
}
