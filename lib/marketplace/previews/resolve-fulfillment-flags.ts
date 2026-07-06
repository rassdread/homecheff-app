import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type {
  MarketplaceTileFulfillmentFlags,
  MarketplaceTileFulfillmentMode,
  MarketplaceTileModel,
} from '@/lib/marketplace/tiles/types';

export const EMPTY_FULFILLMENT_FLAGS: MarketplaceTileFulfillmentFlags = {
  pickup: false,
  delivery: false,
  shipping: false,
  digital: false,
  onSite: false,
  onlineSession: false,
};

export function resolveFulfillmentFlags(input: {
  deliveryMode?: string | null;
  listingKind?: ListingKind;
  fulfillmentMode?: MarketplaceTileFulfillmentMode;
}): MarketplaceTileFulfillmentFlags {
  const mode = String(input.deliveryMode ?? '').toUpperCase();
  const flags = { ...EMPTY_FULFILLMENT_FLAGS };

  if (mode === 'PICKUP' || mode === 'BOTH') flags.pickup = true;
  if (mode === 'DELIVERY' || mode === 'BOTH') flags.delivery = true;
  if (mode === 'SHIPPING') flags.shipping = true;

  const kind = input.listingKind;
  if (kind === 'COACHING') flags.onlineSession = true;
  if (kind === 'SERVICE' || kind === 'TASK' || kind === 'WORKSHOP') {
    flags.onSite = true;
  }
  if (input.fulfillmentMode === 'digital') flags.digital = true;
  if (kind === 'INSPIRATION') {
    return EMPTY_FULFILLMENT_FLAGS;
  }

  if (
    !flags.pickup &&
    !flags.delivery &&
    !flags.shipping &&
    !flags.digital &&
    !flags.onSite &&
    !flags.onlineSession
  ) {
    if (input.fulfillmentMode === 'pickup') flags.pickup = true;
    if (input.fulfillmentMode === 'delivery') flags.delivery = true;
    if (input.fulfillmentMode === 'both') {
      flags.pickup = true;
      flags.delivery = true;
    }
    if (input.fulfillmentMode === 'on_site') flags.onSite = true;
  }

  return flags;
}

export function fulfillmentFlagsFromModel(
  model: MarketplaceTileModel,
): MarketplaceTileFulfillmentFlags {
  return model.fulfillmentFlags;
}
