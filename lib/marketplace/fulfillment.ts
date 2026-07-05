import type { DeliveryMode } from '@prisma/client';
import type {
  FulfillmentOptions,
  FulfillmentOptionKey,
} from './listing-taxonomy';
import { FULFILLMENT_KEYS } from './listing-taxonomy';

/**
 * Maps V2 fulfillment checkboxes → legacy single DeliveryMode enum.
 * Preserves checkout/feed compatibility until full multi-fulfillment support.
 */
export function fulfillmentToLegacyDeliveryMode(
  opts: FulfillmentOptions,
): DeliveryMode {
  const pickup = opts.pickup;
  const delivery = opts.delivery || opts.onSiteClient;
  const shipping = opts.shipping || opts.digital;

  if (pickup && delivery && !shipping) return 'BOTH';
  if (pickup && shipping && !delivery) return 'SHIPPING';
  if (!pickup && delivery && shipping) return 'DELIVERY';
  if (delivery && !pickup && !shipping) return 'DELIVERY';
  if (shipping && !pickup && !delivery) return 'SHIPPING';
  if (pickup && !delivery && !shipping) return 'PICKUP';
  if (opts.onSiteProvider && !pickup && !delivery && !shipping && !opts.digital) {
    return 'PICKUP';
  }
  if (opts.digital) return 'SHIPPING';
  return 'PICKUP';
}

/** Legacy delivery enum → V2 checkboxes (best effort for edit flows). */
export function legacyDeliveryToFulfillment(
  mode: DeliveryMode | string | null | undefined,
): FulfillmentOptions {
  const m = String(mode ?? 'PICKUP').toUpperCase();
  const base = {
    pickup: false,
    delivery: false,
    shipping: false,
    digital: false,
    onSiteClient: false,
    onSiteProvider: false,
  };
  switch (m) {
    case 'PICKUP':
      return { ...base, pickup: true };
    case 'DELIVERY':
      return { ...base, delivery: true };
    case 'SHIPPING':
      return { ...base, shipping: true };
    case 'BOTH':
      return { ...base, pickup: true, delivery: true };
    default:
      return { ...base, pickup: true };
  }
}

export function fulfillmentOptionsToApiString(opts: FulfillmentOptions): string {
  const parts: string[] = [];
  if (opts.pickup) parts.push('PICKUP');
  if (opts.delivery) parts.push('DELIVERY');
  if (opts.shipping) parts.push('SHIPPING');
  return parts.length > 0 ? parts.join(',') : 'PICKUP';
}

export function toggleFulfillmentKey(
  opts: FulfillmentOptions,
  key: FulfillmentOptionKey,
  value: boolean,
): FulfillmentOptions {
  return { ...opts, [key]: value };
}

export function anyFulfillmentSelected(opts: FulfillmentOptions): boolean {
  return FULFILLMENT_KEYS.some((k) => opts[k]);
}
