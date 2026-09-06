/**
 * HomeCheff carrier shipping capability flags.
 * EctaroShip is infrastructure — sellers see "Verzenden / Binnen Nederland".
 */

import { parseFulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';

/** Gate: international remains OFF until customs/carrier certification. */
export const INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED = false;

export type CarrierShippingFlags = {
  shippingEnabled: boolean;
  domesticEnabled: boolean;
  /** Always false until INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED + seller opt-in. */
  internationalEnabled: boolean;
};

export function parseCarrierShippingFlags(product: {
  delivery?: string | null;
  fulfillmentOptions?: unknown;
}): CarrierShippingFlags {
  const fo = parseFulfillmentOptions(product.fulfillmentOptions);
  const delivery = String(product.delivery ?? '').toUpperCase();
  const shippingEnabled =
    fo.shipping === true || delivery === 'SHIPPING' || delivery === 'BOTH';

  const raw =
    product.fulfillmentOptions && typeof product.fulfillmentOptions === 'object'
      ? (product.fulfillmentOptions as Record<string, unknown>)
      : {};

  const domesticRequested = raw.shippingDomestic !== false;
  const internationalRequested = raw.shippingInternational === true;

  return {
    shippingEnabled,
    domesticEnabled: shippingEnabled && domesticRequested,
    internationalEnabled:
      shippingEnabled &&
      internationalRequested &&
      INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED,
  };
}

export function isDomesticLane(originCountry: string, destCountry: string): boolean {
  const o = originCountry.trim().toUpperCase();
  const d = destCountry.trim().toUpperCase();
  return o.length === 2 && d.length === 2 && o === d;
}

/** Domestic commercial lane for this phase: NL → NL only. */
export function isSupportedDomesticLane(
  originCountry: string,
  destCountry: string,
): boolean {
  return (
    isDomesticLane(originCountry, destCountry) &&
    originCountry.trim().toUpperCase() === 'NL'
  );
}
