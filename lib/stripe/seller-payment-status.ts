/**
 * Stripe seller payment status for product detail / checkout gating.
 * CTA surfaces should prefer connectUiStatus from live Connect derivation.
 */

import {
  deriveConnectAccountStatusFromDb,
  type HomecheffConnectUiStatus,
} from '@/lib/stripe/connect-account-status';

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
  detailsSubmitted?: boolean | null;
  currentlyDueCount?: number | null;
  pastDueCount?: number | null;
  pendingVerificationCount?: number | null;
  connectUiStatus?: HomecheffConnectUiStatus | null;
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
  connectUiStatus: HomecheffConnectUiStatus;
};

export function resolveConnectUiStatus(
  seller: SellerStripeSnapshot | null | undefined,
): HomecheffConnectUiStatus {
  if (seller?.connectUiStatus) {
    return seller.connectUiStatus;
  }

  const hasAccount = Boolean(seller?.stripeConnectAccountId);
  if (!hasAccount) return 'NOT_STARTED';

  const currentlyDue = seller?.currentlyDueCount ?? 0;
  const pastDue = seller?.pastDueCount ?? 0;
  const pendingVerification = seller?.pendingVerificationCount ?? 0;
  const detailsSubmitted = seller?.detailsSubmitted;
  const chargesEnabled = seller?.chargesEnabled;
  const payoutsEnabled = seller?.payoutsEnabled;

  // Live capability flags always win over stale DB completed.
  if (chargesEnabled === true && payoutsEnabled === true) {
    return 'PAYMENT_READY';
  }

  if (currentlyDue > 0 || pastDue > 0) {
    return 'ACTION_REQUIRED';
  }

  if (
    detailsSubmitted === true &&
    currentlyDue === 0 &&
    pastDue === 0 &&
    (pendingVerification > 0 || chargesEnabled === false || payoutsEnabled === false)
  ) {
    return 'PENDING_VERIFICATION';
  }

  if (chargesEnabled === false || payoutsEnabled === false) {
    return detailsSubmitted === true ? 'PENDING_VERIFICATION' : 'INCOMPLETE';
  }

  if (seller?.stripeConnectOnboardingCompleted && chargesEnabled == null && payoutsEnabled == null) {
    return 'PAYMENT_READY';
  }

  return deriveConnectAccountStatusFromDb({
    stripeConnectAccountId: seller?.stripeConnectAccountId,
    stripeConnectOnboardingCompleted: false,
  }).uiStatus;
}

export function resolveSellerPaymentStatus(
  seller: SellerStripeSnapshot | null | undefined,
): SellerPaymentResolution {
  const connectUiStatus = resolveConnectUiStatus(seller);
  const hasAccount = Boolean(seller?.stripeConnectAccountId);
  const onboardingCompleted = Boolean(seller?.stripeConnectOnboardingCompleted);
  const chargesEnabled = seller?.chargesEnabled;
  const payoutsEnabled = seller?.payoutsEnabled;

  if (connectUiStatus === 'PAYMENT_READY') {
    return {
      status: 'PAYMENTS_READY',
      reason: null,
      paymentsReady: true,
      connectUiStatus: 'PAYMENT_READY',
    };
  }

  if (!hasAccount) {
    return {
      status: 'NOT_CONNECTED',
      reason: 'STRIPE_NOT_CONNECTED',
      paymentsReady: false,
      connectUiStatus: 'NOT_STARTED',
    };
  }

  if (chargesEnabled === false) {
    return {
      status: 'CONNECTED_INCOMPLETE',
      reason: 'STRIPE_CHARGES_DISABLED',
      paymentsReady: false,
      connectUiStatus,
    };
  }

  if (payoutsEnabled === false) {
    return {
      status: 'CONNECTED_INCOMPLETE',
      reason: 'STRIPE_PAYOUTS_DISABLED',
      paymentsReady: false,
      connectUiStatus,
    };
  }

  // Do not upgrade to PAYMENTS_READY from DB onboardingCompleted alone —
  // connectUiStatus / live capability flags are the source of truth above.
  return {
    status: 'CONNECTED_INCOMPLETE',
    reason: 'STRIPE_ONBOARDING_INCOMPLETE',
    paymentsReady: false,
    connectUiStatus,
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
