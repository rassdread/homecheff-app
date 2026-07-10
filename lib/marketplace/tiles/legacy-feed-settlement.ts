/**
 * Derive explicit settlement booleans for legacy dish/listing feed rows.
 * Reuses settlement SSOT — no ad-hoc tile logic.
 */

import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';

export function legacyFeedSettlementBooleans(
  priceCents: number,
  stripeConnectReady: boolean,
): {
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
} {
  const options = resolveSettlementOptions({
    orderMethod: 'HOMECHEFF_PAYMENT',
    priceCents,
    priceModel: 'FIXED',
    listingIntent: 'OFFER',
    stripeConnectReady,
  });

  return {
    acceptHomeCheffPayment: options.acceptsHomeCheffCheckout,
    acceptDirectContact:
      options.acceptsDirectContact ||
      (options.homeCheffCheckoutNeedsConnect && priceCents > 0),
  };
}
