/**
 * Dynamic checkout delivery-option visibility (cart-level).
 *
 * Ordinary marketplace checkout is single-seller (see selectOrdinaryCheckoutItems).
 * Capability is therefore the intersection of every line's product settings.
 * Backend fulfillment ids (pickup / local_delivery / local_provider / shipping) stay unchanged.
 */

export type CheckoutDeliveryOptionId =
  | 'pickup'
  | 'local_delivery'
  | 'local_provider'
  | 'shipping';

export type CartLineDeliveryInput = {
  deliveryMode?: string | null;
  sellerCanDeliver?: boolean | null;
};

export type CourierMatchState =
  | { kind: 'pending' }
  | { kind: 'list'; count: number }
  | { kind: 'error' }
  | { kind: 'idle' };

export type DynamicDeliveryVisibilityInput = {
  lines: CartLineDeliveryInput[];
  /** Feature flag: named HomeCheff courier selection. */
  namedProviderSelectionEnabled: boolean;
  /** EctaroShip / parcel carrier configured for quotes. */
  parcelCarrierConfigured: boolean;
  /** Buyer has validated coordinates (needed for courier match). */
  hasCoordinates: boolean;
  /** Match result after address is known. */
  courierMatch: CourierMatchState;
  /**
   * Preserve accepted / auto-confirmed payable named bookings across remounts
   * even when the match list is temporarily empty.
   */
  preserveLocalProviderSelection: boolean;
  /** Deal checkout with an active community delivery blocks named courier. */
  blockLocalProviderForCommunityDelivery?: boolean;
};

export type DynamicDeliveryVisibility = {
  /** Options that may appear as selectable cards. */
  visibleOptionIds: CheckoutDeliveryOptionId[];
  /** Product supports HomeCheff courier, but no courier after address check. */
  showNoCourierInfo: boolean;
  /** Multi-line cart: lines disagree on a method the UI considered. */
  mixedCapabilityNote: boolean;
  capabilities: {
    pickup: boolean;
    sellerDelivery: boolean;
    localProviderProduct: boolean;
    shipping: boolean;
  };
};

/** Parse product.delivery / fulfillment-derived mode strings. */
export function parseProductDeliveryModes(
  deliveryMode: string | null | undefined,
): Set<string> {
  if (!deliveryMode) return new Set(['PICKUP']);
  const raw = deliveryMode.trim();
  if (!raw) return new Set(['PICKUP']);
  if (raw.toUpperCase() === 'BOTH') return new Set(['PICKUP', 'DELIVERY']);
  if (raw.includes(',')) {
    return new Set(
      raw
        .split(',')
        .map((part) => part.trim().toUpperCase())
        .filter(Boolean),
    );
  }
  return new Set([raw.toUpperCase()]);
}

function everyLineSupports(
  lines: CartLineDeliveryInput[],
  predicate: (modes: Set<string>, line: CartLineDeliveryInput) => boolean,
): boolean {
  if (lines.length === 0) return false;
  return lines.every((line) => predicate(parseProductDeliveryModes(line.deliveryMode), line));
}

/**
 * Resolve which checkout cards to show.
 * Unavailable methods are omitted (no red/grey disabled cards).
 */
export function resolveDynamicDeliveryVisibility(
  input: DynamicDeliveryVisibilityInput,
): DynamicDeliveryVisibility {
  const { lines } = input;

  const pickup = everyLineSupports(lines, (modes) => modes.has('PICKUP'));
  const deliveryEligible = everyLineSupports(lines, (modes) => modes.has('DELIVERY'));
  const shippingEligible = everyLineSupports(lines, (modes) => modes.has('SHIPPING'));

  const sellerDelivery =
    deliveryEligible &&
    everyLineSupports(lines, (_modes, line) => Boolean(line.sellerCanDeliver));

  const localProviderProduct =
    deliveryEligible &&
    input.namedProviderSelectionEnabled &&
    !input.blockLocalProviderForCommunityDelivery;

  const shipping = shippingEligible && input.parcelCarrierConfigured;

  const visible: CheckoutDeliveryOptionId[] = [];
  if (pickup) visible.push('pickup');
  if (sellerDelivery) visible.push('local_delivery');

  let showNoCourierInfo = false;
  if (localProviderProduct) {
    if (input.preserveLocalProviderSelection) {
      visible.push('local_provider');
    } else if (!input.hasCoordinates) {
      // Address still needed — keep a selectable entry point.
      visible.push('local_provider');
    } else if (input.courierMatch.kind === 'pending') {
      visible.push('local_provider');
    } else if (input.courierMatch.kind === 'list' && input.courierMatch.count > 0) {
      visible.push('local_provider');
    } else {
      // Address checked; no courier (or match error) — info only, no dead card.
      showNoCourierInfo = true;
    }
  }

  if (shipping) visible.push('shipping');

  // Soft signal when some lines differ (e.g. union would have been wider than intersection).
  const anyPickup = lines.some((line) => parseProductDeliveryModes(line.deliveryMode).has('PICKUP'));
  const anyDelivery = lines.some((line) =>
    parseProductDeliveryModes(line.deliveryMode).has('DELIVERY'),
  );
  const anyShipping = lines.some((line) =>
    parseProductDeliveryModes(line.deliveryMode).has('SHIPPING'),
  );
  const mixedCapabilityNote =
    lines.length > 1 &&
    ((anyPickup && !pickup) ||
      (anyDelivery && !deliveryEligible) ||
      (anyShipping && !shippingEligible));

  return {
    visibleOptionIds: visible,
    showNoCourierInfo,
    mixedCapabilityNote,
    capabilities: {
      pickup,
      sellerDelivery,
      localProviderProduct,
      shipping,
    },
  };
}

export function isCheckoutDeliveryOptionVisible(
  optionId: CheckoutDeliveryOptionId,
  visibility: DynamicDeliveryVisibility,
): boolean {
  return visibility.visibleOptionIds.includes(optionId);
}
