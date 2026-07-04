/** Stripe-verkopersstatus voor productdetail en checkout-gating (geen gevoelige Stripe-data). */

export type SellerPaymentStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED_INCOMPLETE'
  | 'PAYMENTS_READY'
  | 'UNKNOWN';

export type CheckoutBlockedReason =
  | 'STRIPE_NOT_CONNECTED'
  | 'STRIPE_ONBOARDING_INCOMPLETE'
  | 'STRIPE_CHARGES_DISABLED'
  | 'STRIPE_PAYOUTS_DISABLED'
  | 'PAYMENTS_NOT_READY';

export type SellerStripeSnapshot = {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  chargesEnabled?: boolean | null;
  payoutsEnabled?: boolean | null;
};

export type PublicPaymentStatus = {
  status: SellerPaymentStatus;
  canCheckout: boolean;
  reason: CheckoutBlockedReason | null;
  hasStripeAccount: boolean;
  onboardingCompleted: boolean;
};

export type SellerPaymentResolution = {
  status: SellerPaymentStatus;
  reason: CheckoutBlockedReason | null;
  paymentsReady: boolean;
};

export function resolveSellerPaymentStatus(
  seller: SellerStripeSnapshot | null | undefined,
): SellerPaymentResolution {
  const hasAccount = Boolean(seller?.stripeConnectAccountId);
  const onboardingCompleted = Boolean(seller?.stripeConnectOnboardingCompleted);
  const chargesEnabled = seller?.chargesEnabled;
  const payoutsEnabled = seller?.payoutsEnabled;

  if (!hasAccount) {
    return {
      status: 'NOT_CONNECTED',
      reason: 'STRIPE_NOT_CONNECTED',
      paymentsReady: false,
    };
  }

  if (chargesEnabled === false) {
    return {
      status: 'CONNECTED_INCOMPLETE',
      reason: 'STRIPE_CHARGES_DISABLED',
      paymentsReady: false,
    };
  }

  if (payoutsEnabled === false) {
    return {
      status: 'CONNECTED_INCOMPLETE',
      reason: 'STRIPE_PAYOUTS_DISABLED',
      paymentsReady: false,
    };
  }

  if (onboardingCompleted) {
    return {
      status: 'PAYMENTS_READY',
      reason: null,
      paymentsReady: true,
    };
  }

  if (hasAccount && !onboardingCompleted) {
    return {
      status: 'CONNECTED_INCOMPLETE',
      reason: 'STRIPE_ONBOARDING_INCOMPLETE',
      paymentsReady: false,
    };
  }

  return {
    status: 'UNKNOWN',
    reason: 'PAYMENTS_NOT_READY',
    paymentsReady: false,
  };
}

export function buildPublicPaymentStatus(params: {
  requiresStripeCheckout: boolean;
  seller: SellerStripeSnapshot | null | undefined;
}): PublicPaymentStatus {
  const resolution = resolveSellerPaymentStatus(params.seller);
  const hasStripeAccount = Boolean(params.seller?.stripeConnectAccountId);
  const onboardingCompleted = Boolean(params.seller?.stripeConnectOnboardingCompleted);

  if (!params.requiresStripeCheckout) {
    return {
      status: resolution.status,
      canCheckout: false,
      reason: null,
      hasStripeAccount,
      onboardingCompleted,
    };
  }

  const canCheckout = resolution.paymentsReady;

  return {
    status: resolution.status,
    canCheckout,
    reason: canCheckout ? null : resolution.reason,
    hasStripeAccount,
    onboardingCompleted,
  };
}

export function resolveCheckoutBlockedReason(
  requiresStripeCheckout: boolean,
  seller: SellerStripeSnapshot | null | undefined,
): CheckoutBlockedReason | null {
  if (!requiresStripeCheckout) return null;
  const { paymentsReady, reason } = resolveSellerPaymentStatus(seller);
  return paymentsReady ? null : reason;
}

/** i18n-key onder productOrder.* voor koperswaarschuwing op productdetail. */
export function getBuyerPaymentWarningKey(
  paymentStatus: Pick<PublicPaymentStatus, 'status' | 'reason'> | null | undefined,
): string {
  const reason = paymentStatus?.reason;
  if (reason === 'STRIPE_CHARGES_DISABLED' || reason === 'STRIPE_PAYOUTS_DISABLED') {
    return 'productOrder.buyerPaymentsTemporarilyUnavailable';
  }
  if (reason === 'STRIPE_ONBOARDING_INCOMPLETE') {
    return 'productOrder.buyerPaymentsOnboardingIncomplete';
  }
  if (reason === 'STRIPE_NOT_CONNECTED' || paymentStatus?.status === 'NOT_CONNECTED') {
    return 'productOrder.buyerPaymentsNotConnected';
  }
  if (paymentStatus?.status === 'CONNECTED_INCOMPLETE') {
    return 'productOrder.buyerPaymentsOnboardingIncomplete';
  }
  return 'productOrder.buyerPaymentsUnknown';
}
