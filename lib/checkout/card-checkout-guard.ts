import { evaluateHcSelfDealing } from '@/lib/hc/hc-self-dealing';

/**
 * Card-checkout authorization that must finish before a stock hold or a
 * Stripe Checkout Session. Listing visibility in the UI is not an input.
 * Self-dealing uses the same evaluator as HomeCheff-points checkout.
 */

export type CardCheckoutListing = {
  id: string;
  isActive: boolean;
  integrityStatus?: string | null;
  sellerUserId?: string | null;
  sellerStripeConnectAccountId?: string | null;
};

export type CardCheckoutGateCode =
  | 'LISTING_INACTIVE'
  | 'LISTING_INTEGRITY'
  | 'SELF_PURCHASE'
  | 'SHARED_CONNECT_DESTINATION';

export type CardCheckoutGateResult =
  | { proceed: true }
  | {
      proceed: false;
      code: CardCheckoutGateCode;
      beforeStripe: true;
      beforeStockHold: true;
    };

const SALE_INTEGRITY = 'ACTIVE';

export function listingIsEligibleForCardSale(listing: {
  isActive: boolean;
  integrityStatus?: string | null;
}): boolean {
  return listing.isActive === true && listing.integrityStatus === SALE_INTEGRITY;
}

export function evaluateCardCheckoutGate(input: {
  buyerUserId: string;
  buyerCentralUserId?: string | null;
  buyerStripeConnectAccountId?: string | null;
  products: CardCheckoutListing[];
}): CardCheckoutGateResult {
  for (const product of input.products) {
    if (product.isActive !== true) {
      return {
        proceed: false,
        code: 'LISTING_INACTIVE',
        beforeStripe: true,
        beforeStockHold: true,
      };
    }
    if (product.integrityStatus !== SALE_INTEGRITY) {
      return {
        proceed: false,
        code: 'LISTING_INTEGRITY',
        beforeStripe: true,
        beforeStockHold: true,
      };
    }
    const sellerUserId = product.sellerUserId?.trim() || '';
    if (!sellerUserId) continue;
    const decision = evaluateHcSelfDealing({
      buyerUserId: input.buyerUserId,
      sellerUserId,
      buyerCentralUserId: input.buyerCentralUserId,
      sellerCentralUserId: sellerUserId,
      buyerStripeConnectAccountId: input.buyerStripeConnectAccountId,
      sellerStripeConnectAccountId: product.sellerStripeConnectAccountId,
    });
    if (decision.blocked) {
      return {
        proceed: false,
        code: decision.code,
        beforeStripe: true,
        beforeStockHold: true,
      };
    }
  }
  return { proceed: true };
}

export function cardCheckoutGateErrorKey(code: CardCheckoutGateCode): string {
  switch (code) {
    case 'SELF_PURCHASE':
      return 'checkout.errors.selfPurchase';
    case 'SHARED_CONNECT_DESTINATION':
      return 'checkout.errors.sharedConnectDestination';
    case 'LISTING_INACTIVE':
      return 'checkout.errors.listingInactive';
    case 'LISTING_INTEGRITY':
      return 'checkout.errors.listingIntegrity';
  }
}

/** Same delivery compatibility rules as the card checkout route. */
export function productSupportsRequestedDelivery(
  productDelivery: string,
  requestedMode: string,
): boolean {
  const mode = requestedMode.toUpperCase();
  const isPickup = mode === 'PICKUP';
  const isDelivery =
    mode === 'DELIVERY' ||
    mode === 'LOCAL_DELIVERY' ||
    mode === 'TEEN_DELIVERY' ||
    mode === 'LOCAL_PROVIDER';
  const isShipping = mode === 'SHIPPING';
  if (isPickup) return productDelivery === 'PICKUP' || productDelivery === 'BOTH';
  if (isDelivery) return productDelivery === 'DELIVERY' || productDelivery === 'BOTH';
  if (isShipping) return productDelivery === 'SHIPPING' || productDelivery === 'BOTH';
  return true;
}

export function allRequestedProductsFound(
  requestedCount: number,
  foundCount: number,
): boolean {
  return requestedCount > 0 && requestedCount === foundCount;
}
