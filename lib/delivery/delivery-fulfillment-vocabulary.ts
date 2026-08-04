/**
 * Canonical delivery fulfillment vocabulary + legacy normalization (Phase 1).
 * No Prisma enum migration — mapping layer only.
 */

export const CANONICAL_FULFILLMENT_METHODS = [
  'PICKUP',
  'SELLER_DELIVERY',
  'LOCAL_PROVIDER',
  'PARCEL_SHIPPING',
  'IN_CONSULTATION',
] as const;

export type CanonicalFulfillmentMethod =
  (typeof CANONICAL_FULFILLMENT_METHODS)[number];

/** Checkout UI option ids (canonical). */
export const CHECKOUT_FULFILLMENT_OPTION_IDS = {
  pickup: 'pickup',
  sellerLocalDelivery: 'local_delivery',
  localProvider: 'local_provider',
  /** @deprecated legacy UI id — accept for read compat only */
  legacyTeenDelivery: 'teen_delivery',
  shipping: 'shipping',
} as const;

export type NormalizeFulfillmentResult = {
  canonical: CanonicalFulfillmentMethod | null;
  /** Value safe to persist on Order.deliveryMode Prisma enum path */
  prismaDeliveryMode: 'PICKUP' | 'DELIVERY' | 'SHIPPING' | 'BOTH' | null;
  /** True when input used retired TEEN_* identifier */
  normalizedFromLegacyTeen: boolean;
  displayKey: string;
};

/**
 * Resolve LOCAL_DELIVERY ambiguity:
 * - Checkout option `local_delivery` = seller self-delivery (hasSellerDelivery path).
 * - API/webhook LOCAL_DELIVERY historically mapped to seller delivery fee path
 *   (SELLER_DELIVERY pricing type in calculate-delivery-fee).
 * - TEEN_DELIVERY / teen_delivery / DELIVERY (platform pool) = LOCAL_PROVIDER.
 */
export function normalizeFulfillmentInput(
  raw: string | null | undefined,
  context?: { preferSellerDeliveryForLocalDelivery?: boolean }
): NormalizeFulfillmentResult {
  if (!raw || typeof raw !== 'string') {
    return {
      canonical: null,
      prismaDeliveryMode: null,
      normalizedFromLegacyTeen: false,
      displayKey: 'unknown',
    };
  }

  const value = raw.trim();
  const upper = value.toUpperCase();
  const lower = value.toLowerCase();

  if (lower === 'pickup' || upper === 'PICKUP') {
    return {
      canonical: 'PICKUP',
      prismaDeliveryMode: 'PICKUP',
      normalizedFromLegacyTeen: false,
      displayKey: 'pickup',
    };
  }

  if (lower === 'shipping' || upper === 'SHIPPING' || upper === 'PARCEL_SHIPPING') {
    return {
      canonical: 'PARCEL_SHIPPING',
      prismaDeliveryMode: 'SHIPPING',
      normalizedFromLegacyTeen: false,
      displayKey: 'parcel_shipping',
    };
  }

  if (
    upper === 'IN_CONSULTATION' ||
    lower === 'in_consultation' ||
    lower === 'consultation'
  ) {
    return {
      canonical: 'IN_CONSULTATION',
      prismaDeliveryMode: null,
      normalizedFromLegacyTeen: false,
      displayKey: 'in_consultation',
    };
  }

  const fromTeen =
    upper === 'TEEN_DELIVERY' ||
    lower === 'teen_delivery' ||
    lower === 'teen-delivery';

  if (
    fromTeen ||
    upper === 'LOCAL_PROVIDER' ||
    lower === 'local_provider' ||
    // Platform pool historically written as DELIVERY / TEEN_DELIVERY
    (upper === 'DELIVERY' && !fromTeen)
  ) {
    if (fromTeen) {
      console.info('[delivery-vocabulary]', {
        event: 'legacy_teen_normalized',
        from: value,
        to: 'LOCAL_PROVIDER',
      });
    }
    return {
      canonical: 'LOCAL_PROVIDER',
      prismaDeliveryMode: 'DELIVERY',
      normalizedFromLegacyTeen: fromTeen,
      displayKey: 'local_provider',
    };
  }

  // Seller self-delivery markers
  if (
    upper === 'SELLER_DELIVERY' ||
    lower === 'seller_delivery' ||
    lower === 'local_delivery' ||
    upper === 'LOCAL_DELIVERY'
  ) {
    const preferSeller =
      context?.preferSellerDeliveryForLocalDelivery !== false;
    if (preferSeller || lower === 'local_delivery' || upper === 'LOCAL_DELIVERY') {
      return {
        canonical: 'SELLER_DELIVERY',
        prismaDeliveryMode: 'DELIVERY',
        normalizedFromLegacyTeen: false,
        displayKey: 'seller_delivery',
      };
    }
  }

  if (upper === 'BOTH') {
    return {
      canonical: null,
      prismaDeliveryMode: 'BOTH',
      normalizedFromLegacyTeen: false,
      displayKey: 'both',
    };
  }

  if (upper === 'PLATFORM_DELIVERERS') {
    return {
      canonical: 'LOCAL_PROVIDER',
      prismaDeliveryMode: 'DELIVERY',
      normalizedFromLegacyTeen: false,
      displayKey: 'local_provider',
    };
  }

  return {
    canonical: null,
    prismaDeliveryMode: null,
    normalizedFromLegacyTeen: false,
    displayKey: 'unknown',
  };
}

/** True for checkout selection of local-provider (incl. legacy teen_delivery id). */
export function isLocalProviderCheckoutSelection(
  selectedDelivery: string | null | undefined
): boolean {
  if (!selectedDelivery) return false;
  const lower = selectedDelivery.toLowerCase();
  return lower === 'local_provider' || lower === 'teen_delivery';
}

/** True for seller self-delivery checkout option. */
export function isSellerDeliveryCheckoutSelection(
  selectedDelivery: string | null | undefined
): boolean {
  return selectedDelivery?.toLowerCase() === 'local_delivery';
}

/**
 * Value to send/store going forward for local-provider checkout.
 * Never write TEEN_DELIVERY.
 */
export function outboundLocalProviderMode(): 'LOCAL_PROVIDER' {
  return 'LOCAL_PROVIDER';
}

export const DELIVERY_COPY = {
  nl: {
    localProvider: 'Lokale bezorgaanbieder',
    independentCourier: 'Zelfstandige bezorger',
    deliveryBusiness: 'Bezorgbedrijf',
    providerViaPlatform: 'Bezorger via HomeCheff',
    selectedProvider: 'Gekozen bezorgaanbieder',
    localProvidersViaPlatform: 'Lokale bezorgaanbieders via HomeCheff',
    sellerDelivers: 'Verkoper bezorgt zelf',
    marketplaceFacilitates: 'HomeCheff faciliteert het contact en de boeking',
    marketplaceLabel: 'HomeCheff bezorgmarktplaats',
    profileVerified: 'Profiel geverifieerd',
    identityVerified: 'Identiteit geverifieerd',
  },
  en: {
    localProvider: 'Local delivery provider',
    independentCourier: 'Independent courier',
    deliveryBusiness: 'Delivery business',
    providerViaPlatform: 'Delivery provider via HomeCheff',
    selectedProvider: 'Selected delivery provider',
    localProvidersViaPlatform: 'Local delivery providers via HomeCheff',
    sellerDelivers: 'Seller delivery',
    marketplaceFacilitates:
      'HomeCheff facilitates contact and booking',
    marketplaceLabel: 'HomeCheff delivery marketplace',
    profileVerified: 'Profile verified',
    identityVerified: 'Identity verified',
  },
} as const;
