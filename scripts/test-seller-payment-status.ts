/**
 * Unit tests for Stripe seller payment readiness helpers.
 * Run: npx tsx scripts/test-seller-payment-status.ts
 */

import assert from 'node:assert/strict';
import {
  buildPublicPaymentStatus,
  getBuyerPaymentWarningKey,
  resolveCheckoutBlockedReason,
  resolveSellerPaymentStatus,
} from '../lib/stripe/seller-payment-status';

function testNotConnected() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: null,
    stripeConnectOnboardingCompleted: false,
  });
  assert.equal(resolution.status, 'NOT_CONNECTED');
  assert.equal(resolution.reason, 'STRIPE_NOT_CONNECTED');
  assert.equal(resolution.paymentsReady, false);

  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: true,
    seller: { stripeConnectAccountId: null, stripeConnectOnboardingCompleted: false },
  });
  assert.equal(payment.canCheckout, false);
  assert.equal(payment.reason, 'STRIPE_NOT_CONNECTED');
  assert.equal(payment.hasStripeAccount, false);
  assert.equal(
    getBuyerPaymentWarningKey(payment),
    'productOrder.buyerPaymentsNotConnected',
  );
}

function testAccountOnboardingFalse() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: 'acct_123',
    stripeConnectOnboardingCompleted: false,
  });
  assert.equal(resolution.status, 'CONNECTED_INCOMPLETE');
  assert.equal(resolution.reason, 'STRIPE_ONBOARDING_INCOMPLETE');
  assert.equal(resolution.paymentsReady, false);

  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: true,
    seller: {
      stripeConnectAccountId: 'acct_123',
      stripeConnectOnboardingCompleted: false,
    },
  });
  assert.equal(payment.canCheckout, false);
  assert.equal(payment.hasStripeAccount, true);
  assert.equal(payment.onboardingCompleted, false);
  assert.equal(
    getBuyerPaymentWarningKey(payment),
    'productOrder.buyerPaymentsOnboardingIncomplete',
  );
}

function testOnboardingTrue() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: 'acct_123',
    stripeConnectOnboardingCompleted: true,
  });
  assert.equal(resolution.status, 'PAYMENTS_READY');
  assert.equal(resolution.reason, null);
  assert.equal(resolution.paymentsReady, true);

  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: true,
    seller: {
      stripeConnectAccountId: 'acct_123',
      stripeConnectOnboardingCompleted: true,
    },
  });
  assert.equal(payment.canCheckout, true);
  assert.equal(payment.reason, null);
}

function testLiveChargesPayoutsTrue() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: 'acct_123',
    stripeConnectOnboardingCompleted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
  });
  assert.equal(resolution.status, 'PAYMENTS_READY');
  assert.equal(resolution.paymentsReady, true);
}

function testLiveChargesDisabled() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: 'acct_123',
    stripeConnectOnboardingCompleted: true,
    chargesEnabled: false,
    payoutsEnabled: true,
  });
  assert.equal(resolution.status, 'CONNECTED_INCOMPLETE');
  assert.equal(resolution.reason, 'STRIPE_CHARGES_DISABLED');
  assert.equal(resolution.paymentsReady, false);

  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: true,
    seller: {
      stripeConnectAccountId: 'acct_123',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: false,
      payoutsEnabled: true,
    },
  });
  assert.equal(
    getBuyerPaymentWarningKey(payment),
    'productOrder.buyerPaymentsTemporarilyUnavailable',
  );
}

function testLivePayoutsDisabled() {
  const resolution = resolveSellerPaymentStatus({
    stripeConnectAccountId: 'acct_123',
    stripeConnectOnboardingCompleted: false,
    chargesEnabled: true,
    payoutsEnabled: false,
  });
  assert.equal(resolution.reason, 'STRIPE_PAYOUTS_DISABLED');
  assert.equal(
    getBuyerPaymentWarningKey(
      buildPublicPaymentStatus({
        requiresStripeCheckout: true,
        seller: {
          stripeConnectAccountId: 'acct_123',
          stripeConnectOnboardingCompleted: false,
          chargesEnabled: true,
          payoutsEnabled: false,
        },
      }),
    ),
    'productOrder.buyerPaymentsTemporarilyUnavailable',
  );
}

function testContactOnlyProduct() {
  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: false,
    seller: {
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    },
  });
  assert.equal(payment.canCheckout, false);
  assert.equal(payment.reason, null);
  assert.equal(resolveCheckoutBlockedReason(false, null), null);
}

function testHomecheffPaymentProductBlocked() {
  const reason = resolveCheckoutBlockedReason(true, {
    stripeConnectAccountId: 'acct_abc',
    stripeConnectOnboardingCompleted: false,
  });
  assert.equal(reason, 'STRIPE_ONBOARDING_INCOMPLETE');
}

function testUnknownFallback() {
  const payment = buildPublicPaymentStatus({
    requiresStripeCheckout: true,
    seller: {
      stripeConnectAccountId: 'acct_x',
      stripeConnectOnboardingCompleted: false,
      chargesEnabled: null,
      payoutsEnabled: null,
    },
  });
  assert.equal(payment.status, 'CONNECTED_INCOMPLETE');
  assert.equal(
    getBuyerPaymentWarningKey({ status: 'UNKNOWN', reason: 'PAYMENTS_NOT_READY' }),
    'productOrder.buyerPaymentsUnknown',
  );
}

function main() {
  testNotConnected();
  testAccountOnboardingFalse();
  testOnboardingTrue();
  testLiveChargesPayoutsTrue();
  testLiveChargesDisabled();
  testLivePayoutsDisabled();
  testContactOnlyProduct();
  testHomecheffPaymentProductBlocked();
  testUnknownFallback();
  console.log('test-seller-payment-status: all passed');
}

main();
