'use strict';

/**
 * HomeCheff-collected EUR checkout minimum (owner-approved micro-order floor).
 * Applies to new Stripe checkout session creation only — not listings or direct/cash.
 */

export const MINIMUM_CHECKOUT_CENTS = 1000;

export const CHECKOUT_MINIMUM_NOT_MET = 'CHECKOUT_MINIMUM_NOT_MET' as const;

export type CheckoutFloorLineItem = {
  productId: string;
  quantity: number;
  /** Authoritative unit price in cents (DB or validated negotiated deal). */
  unitPriceCents: number;
};

export type CheckoutFloorInput = {
  lineItems: CheckoutFloorLineItem[];
  deliveryFeeCents: number;
  /** Platform add-ons must not satisfy the floor (SMS, etc.). */
  smsNotificationCostCents?: number;
};

export type CheckoutFloorEvaluation = {
  eligible: boolean;
  minimumCents: number;
  /** Items + delivery, before buyer payment-processing surcharge. */
  eligibleBaseCents: number;
  productsTotalCents: number;
  deliveryFeeCents: number;
  code?: typeof CHECKOUT_MINIMUM_NOT_MET;
  errorKey?: 'checkout.errors.minimumNotMet';
};

export function sumProductsTotalCents(lineItems: CheckoutFloorLineItem[]): number {
  return lineItems.reduce(
    (sum, item) => sum + item.unitPriceCents * Math.max(0, item.quantity),
    0,
  );
}

/** Floor base = seller transaction value before Stripe gross-up; delivery counts, SMS does not. */
export function computeCheckoutEligibleBaseCents(input: {
  productsTotalCents: number;
  deliveryFeeCents: number;
}): number {
  return Math.max(0, input.productsTotalCents + Math.max(0, input.deliveryFeeCents));
}

export function evaluateCheckoutFloor(input: CheckoutFloorInput): CheckoutFloorEvaluation {
  const productsTotalCents = sumProductsTotalCents(input.lineItems);
  const deliveryFeeCents = Math.max(0, input.deliveryFeeCents);
  const eligibleBaseCents = computeCheckoutEligibleBaseCents({
    productsTotalCents,
    deliveryFeeCents,
  });

  if (eligibleBaseCents >= MINIMUM_CHECKOUT_CENTS) {
    return {
      eligible: true,
      minimumCents: MINIMUM_CHECKOUT_CENTS,
      eligibleBaseCents,
      productsTotalCents,
      deliveryFeeCents,
    };
  }

  return {
    eligible: false,
    minimumCents: MINIMUM_CHECKOUT_CENTS,
    eligibleBaseCents,
    productsTotalCents,
    deliveryFeeCents,
    code: CHECKOUT_MINIMUM_NOT_MET,
    errorKey: 'checkout.errors.minimumNotMet',
  };
}

export type AuthoritativePriceProduct = { id: string; priceCents: number };

/**
 * Resolve server-authoritative unit price per cart line.
 * Negotiated community-order deals use validated client price; standard cart uses DB listing price.
 */
export function resolveAuthoritativeUnitPriceCents(
  product: AuthoritativePriceProduct,
  clientPriceCents: number,
  options?: { communityOrderValidated?: boolean },
): number {
  if (options?.communityOrderValidated) {
    return Math.max(0, Math.round(clientPriceCents));
  }
  return Math.max(0, product.priceCents);
}

export function buildAuthoritativeLineItems(
  items: Array<{ productId: string; quantity: number; priceCents: number }>,
  products: AuthoritativePriceProduct[],
  options?: { communityOrderValidated?: boolean },
): CheckoutFloorLineItem[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPriceCents = product
      ? resolveAuthoritativeUnitPriceCents(product, item.priceCents, options)
      : Math.max(0, Math.round(item.priceCents));
    return {
      productId: item.productId,
      quantity: Math.max(0, item.quantity),
      unitPriceCents,
    };
  });
}
