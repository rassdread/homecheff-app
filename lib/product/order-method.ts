/** Verkoopvorm: HomeCheff checkout vs. direct contact (Fase 2C). */

export type ProductOrderMethodValue = 'HOMECHEFF_PAYMENT' | 'CONTACT';

export const PRODUCT_ORDER_METHODS: ProductOrderMethodValue[] = [
  'HOMECHEFF_PAYMENT',
  'CONTACT',
];

export function parseProductOrderMethod(
  raw: unknown,
): ProductOrderMethodValue {
  return raw === 'CONTACT' ? 'CONTACT' : 'HOMECHEFF_PAYMENT';
}

export function isContactOnlyProduct(product: {
  orderMethod?: ProductOrderMethodValue | string | null;
}): boolean {
  return product.orderMethod === 'CONTACT';
}

export function isHomecheffCheckoutProduct(product: {
  orderMethod?: ProductOrderMethodValue | string | null;
}): boolean {
  return !isContactOnlyProduct(product);
}

export function hasPublicDisplayPrice(product: {
  priceCents?: number | null;
}): boolean {
  return typeof product.priceCents === 'number' && product.priceCents > 0;
}

export function formatProductPriceLabel(
  product: {
    priceCents?: number | null;
    orderMethod?: ProductOrderMethodValue | string | null;
  },
  t: (key: string) => string,
): string {
  if (hasPublicDisplayPrice(product)) {
    return `€${(product.priceCents! / 100).toFixed(2)}`;
  }
  if (isContactOnlyProduct(product)) {
    return t('productOrder.priceOnRequest');
  }
  return `€${((product.priceCents ?? 0) / 100).toFixed(2)}`;
}

/** Product mag in feed/dorpsplein zichtbaar zijn zonder Stripe Connect. */
export function isCheckoutEligibleForVisibility(product: {
  orderMethod?: ProductOrderMethodValue | string | null;
  priceCents?: number | null;
}): boolean {
  if (isContactOnlyProduct(product)) return true;
  if (!hasPublicDisplayPrice(product)) return true;
  return false;
}

export type SellerPaymentsUser = {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
};

/** Stripe verplicht alleen bij HomeCheff-betaling met prijs > 0. */
export function requiresStripeForHomecheffCheckout(product: {
  orderMethod?: ProductOrderMethodValue | string | null;
  priceCents?: number | null;
}): boolean {
  return isHomecheffCheckoutProduct(product) && hasPublicDisplayPrice(product);
}

export function sellerPaymentsReady(
  user: SellerPaymentsUser | null | undefined,
): boolean {
  return !!(
    user?.stripeConnectAccountId && user?.stripeConnectOnboardingCompleted
  );
}

/** Koper mag via HomeCheff afrekenen. */
export function canPurchaseViaHomecheff(
  product: {
    orderMethod?: ProductOrderMethodValue | string | null;
    priceCents?: number | null;
  },
  sellerUser: SellerPaymentsUser | null | undefined,
): boolean {
  if (!requiresStripeForHomecheffCheckout(product)) return false;
  return sellerPaymentsReady(sellerUser);
}

export type PublishGateResult = {
  isActive: boolean;
  publishBlocked: boolean;
  publishBlockReason?: 'PAYMENTS_REQUIRED';
};

/** Bepaal of product live mag — blokkeer betaald HomeCheff-aanbod zonder betalingen. */
export function resolveProductPublishState(params: {
  requestedActive: boolean;
  orderMethod: ProductOrderMethodValue;
  priceCents: number;
  sellerUser: SellerPaymentsUser | null | undefined;
}): PublishGateResult {
  if (!params.requestedActive) {
    return { isActive: false, publishBlocked: false };
  }
  if (
    requiresStripeForHomecheffCheckout(params) &&
    !sellerPaymentsReady(params.sellerUser)
  ) {
    return {
      isActive: false,
      publishBlocked: true,
      publishBlockReason: 'PAYMENTS_REQUIRED',
    };
  }
  return { isActive: true, publishBlocked: false };
}

/** Publish-gate voor product PATCH/create body + bestaand product. */
export function computePublishGateFromProductUpdate(
  body: {
    isActive?: boolean;
    orderMethod?: unknown;
    priceCents?: number;
  },
  product: {
    isActive: boolean;
    orderMethod?: string | null;
    priceCents: number;
  },
  sellerUser: SellerPaymentsUser | null | undefined,
): PublishGateResult {
  const requestedActive =
    body.isActive !== undefined ? Boolean(body.isActive) : product.isActive;
  const orderMethod =
    body.orderMethod !== undefined
      ? parseProductOrderMethod(body.orderMethod)
      : parseProductOrderMethod(product.orderMethod);
  const priceCents =
    body.priceCents !== undefined ? Number(body.priceCents) : product.priceCents;
  return resolveProductPublishState({
    requestedActive,
    orderMethod,
    priceCents,
    sellerUser,
  });
}
