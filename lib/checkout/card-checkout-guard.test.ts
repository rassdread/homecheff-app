import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  allRequestedProductsFound,
  evaluateCardCheckoutGate,
  listingIsEligibleForCardSale,
  productSupportsRequestedDelivery,
  type CardCheckoutListing,
} from './card-checkout-guard';
import { evaluateHcSelfDealing } from '@/lib/hc/hc-self-dealing';
import { resolveCheckoutBlockReason } from '@/lib/marketplace/settlement/settlement-router';
import {
  requiresStripeForHomecheffCheckout,
  sellerPaymentsReady,
} from '@/lib/product/order-method';
import {
  DEFAULT_PLATFORM_FEE_PERCENT,
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';

const routeSource = readFileSync(
  new URL('../../app/api/checkout/route.ts', import.meta.url),
  'utf8',
);
const pointsSource = readFileSync(
  new URL('../hc/marketplace-hc-order-service.ts', import.meta.url),
  'utf8',
);
const mixedSource = readFileSync(
  new URL('../hc/marketplace-hc-mixed-service.ts', import.meta.url),
  'utf8',
);

function listing(overrides: Partial<CardCheckoutListing> = {}): CardCheckoutListing {
  return {
    id: 'listing-1',
    isActive: true,
    integrityStatus: 'ACTIVE',
    sellerUserId: 'seller-1',
    sellerStripeConnectAccountId: 'acct_seller',
    ...overrides,
  };
}

function readyOnline(priceCents: number) {
  return {
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    orderMethod: 'HOMECHEFF_PAYMENT',
    priceCents,
    sellerStripeReady: true,
  };
}

test('SELF_PURCHASE_CARD_CHECKOUT_BLOCKED', () => {
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'user-1',
    buyerCentralUserId: 'user-1',
    buyerStripeConnectAccountId: 'acct_seller',
    products: [listing({ sellerUserId: 'user-1' })],
  });
  assert.equal(gate.proceed, false);
  if (!gate.proceed) assert.equal(gate.code, 'SELF_PURCHASE');
});

test('SELF_PURCHASE_POINTS_CHECKOUT_STILL_BLOCKED', () => {
  const decision = evaluateHcSelfDealing({
    buyerUserId: 'user-1',
    sellerUserId: 'user-1',
    buyerCentralUserId: 'user-1',
    sellerCentralUserId: 'user-1',
    buyerStripeConnectAccountId: 'acct_seller',
    sellerStripeConnectAccountId: 'acct_seller',
  });
  assert.equal(decision.blocked, true);
  if (decision.blocked) assert.equal(decision.code, 'SELF_PURCHASE');
  assert.match(pointsSource, /evaluateHcSelfDealing\(/);
  assert.match(mixedSource, /evaluateHcSelfDealing\(/);
  assert.match(pointsSource, /if \(!product\?\.isActive\)/);
});

test('DIFFERENT_BUYER_SELLER_CARD_CHECKOUT_ALLOWED', () => {
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    buyerStripeConnectAccountId: 'acct_buyer',
    products: [listing()],
  });
  assert.equal(gate.proceed, true);
});

test('SELF_PURCHASE_REJECTED_BEFORE_STRIPE_CALL', () => {
  let stripeCalled = false;
  let stockHeld = false;
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'user-1',
    buyerCentralUserId: 'central-1',
    products: [listing({ sellerUserId: 'user-1' })],
  });
  if (gate.proceed) {
    stockHeld = true;
    stripeCalled = true;
  }
  assert.equal(gate.proceed, false);
  if (!gate.proceed) {
    assert.equal(gate.beforeStripe, true);
    assert.equal(gate.beforeStockHold, true);
  }
  assert.equal(stockHeld, false);
  assert.equal(stripeCalled, false);
  const gateAt = routeSource.indexOf('evaluateCardCheckoutGate(');
  const stockAt = routeSource.indexOf('holdCheckoutStock(');
  const stripeAt = routeSource.indexOf('checkout.sessions.create');
  assert.ok(gateAt > 0 && stockAt > gateAt && stripeAt > stockAt);
});

test('DIRECT_CONTACT_FLOW_UNCHANGED', () => {
  const reason = resolveCheckoutBlockReason({
    acceptHomeCheffPayment: false,
    acceptDirectContact: true,
    orderMethod: 'CONTACT',
    priceCents: 1500,
    sellerStripeReady: false,
  });
  assert.equal(reason, 'CONTACT_ONLY');
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    products: [listing()],
  });
  assert.equal(gate.proceed, true);
  assert.match(routeSource, /CONTACT_ONLY_NOT_CHECKOUT/);
});

test('ACTIVE_LISTING_CARD_CHECKOUT_ALLOWED', () => {
  assert.equal(
    listingIsEligibleForCardSale({ isActive: true, integrityStatus: 'ACTIVE' }),
    true,
  );
  assert.equal(
    evaluateCardCheckoutGate({
      buyerUserId: 'buyer-1',
      buyerCentralUserId: 'buyer-1',
      products: [listing()],
    }).proceed,
    true,
  );
});

test('INACTIVE_LISTING_CARD_CHECKOUT_BLOCKED', () => {
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    products: [listing({ isActive: false })],
  });
  assert.equal(gate.proceed, false);
  if (!gate.proceed) assert.equal(gate.code, 'LISTING_INACTIVE');
});

test('NON_ACTIVE_INTEGRITY_CARD_CHECKOUT_BLOCKED', () => {
  for (const integrityStatus of ['REVIEW_REQUIRED', 'TEMPORARILY_HIDDEN', 'UNDER_REVIEW', 'REMOVED']) {
    const gate = evaluateCardCheckoutGate({
      buyerUserId: 'buyer-1',
      buyerCentralUserId: 'buyer-1',
      products: [listing({ integrityStatus })],
    });
    assert.equal(gate.proceed, false);
    if (!gate.proceed) assert.equal(gate.code, 'LISTING_INTEGRITY');
  }
});

test('DIRECT_API_REQUEST_INACTIVE_LISTING_BLOCKED', () => {
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    products: [listing({ isActive: false, integrityStatus: 'ACTIVE' })],
  });
  assert.equal(gate.proceed, false);
  if (!gate.proceed) assert.equal(gate.code, 'LISTING_INACTIVE');
});

test('NO_STRIPE_SESSION_FOR_INACTIVE_LISTING', () => {
  const calls: string[] = [];
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    products: [listing({ isActive: false })],
  });
  if (!gate.proceed) {
    assert.equal(gate.beforeStripe, true);
  } else {
    calls.push('stripe');
  }
  assert.deepEqual(calls, []);
});

test('CONTACT_ONLY_LISTING_STILL_BLOCKED_FROM_CARD_CHECKOUT', () => {
  assert.equal(
    resolveCheckoutBlockReason({
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      priceCents: 2500,
      sellerStripeReady: true,
    }),
    'CONTACT_ONLY',
  );
});

test('valid buyer and seller pass the card gate', () => {
  assert.equal(
    evaluateCardCheckoutGate({
      buyerUserId: 'buyer-1',
      buyerCentralUserId: 'central-buyer',
      buyerStripeConnectAccountId: 'acct_buyer',
      products: [listing({ sellerUserId: 'seller-1', sellerStripeConnectAccountId: 'acct_seller' })],
    }).proceed,
    true,
  );
});

test('shared Connect destination is rejected before Stripe', () => {
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'central-buyer',
    buyerStripeConnectAccountId: 'acct_same',
    products: [listing({ sellerUserId: 'seller-1', sellerStripeConnectAccountId: 'acct_same' })],
  });
  assert.equal(gate.proceed, false);
  if (!gate.proceed) {
    assert.equal(gate.code, 'SHARED_CONNECT_DESTINATION');
    assert.equal(gate.beforeStripe, true);
  }
});

test('online, both-method, and contact settlement stay distinct', () => {
  assert.equal(resolveCheckoutBlockReason(readyOnline(1200)), null);
  assert.equal(
    resolveCheckoutBlockReason({
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      priceCents: 1200,
      sellerStripeReady: true,
    }),
    null,
  );
  assert.equal(
    resolveCheckoutBlockReason({
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      priceCents: 1200,
      sellerStripeReady: true,
    }),
    'CONTACT_ONLY',
  );
});

test('seller Connect readiness follows the stored payout flag', () => {
  assert.equal(sellerPaymentsReady(null), false);
  assert.equal(sellerPaymentsReady({ stripeConnectAccountId: null, stripeConnectOnboardingCompleted: false }), false);
  assert.equal(
    sellerPaymentsReady({ stripeConnectAccountId: 'acct_1', stripeConnectOnboardingCompleted: false }),
    false,
  );
  assert.equal(
    sellerPaymentsReady({ stripeConnectAccountId: 'acct_1', stripeConnectOnboardingCompleted: true }),
    true,
  );
  assert.equal(
    resolveCheckoutBlockReason({ ...readyOnline(1800), sellerStripeReady: false }),
    'PAYMENTS_NOT_READY',
  );
  assert.equal(resolveCheckoutBlockReason(readyOnline(1800)), null);
});

test('zero-price online listing does not require Connect and a positive price does', () => {
  assert.equal(requiresStripeForHomecheffCheckout(readyOnline(0)), false);
  assert.equal(requiresStripeForHomecheffCheckout(readyOnline(100)), true);
  assert.equal(
    resolveCheckoutBlockReason({ ...readyOnline(0), sellerStripeReady: false }),
    'NOT_ELIGIBLE',
  );
});

test('a blocked gate does not reserve stock', () => {
  let reserved = false;
  const gate = evaluateCardCheckoutGate({
    buyerUserId: 'buyer-1',
    buyerCentralUserId: 'buyer-1',
    products: [listing({ integrityStatus: 'REMOVED' })],
  });
  if (gate.proceed) reserved = true;
  assert.equal(reserved, false);
  assert.ok(routeSource.indexOf('evaluateCardCheckoutGate(') < routeSource.indexOf('holdCheckoutStock('));
});

test('invalid product id is rejected before Stripe', () => {
  assert.equal(allRequestedProductsFound(2, 1), false);
  assert.equal(allRequestedProductsFound(1, 1), true);
  assert.match(routeSource, /Some products not found/);
  assert.ok(routeSource.indexOf('Some products not found') < routeSource.indexOf('checkout.sessions.create'));
});

test('unauthenticated checkout is rejected before the card gate and Stripe', () => {
  const unauthorizedAt = routeSource.indexOf("error: 'Unauthorized'");
  const gateAt = routeSource.indexOf('evaluateCardCheckoutGate(');
  const stripeAt = routeSource.indexOf('checkout.sessions.create');
  assert.ok(unauthorizedAt > 0 && unauthorizedAt < gateAt && gateAt < stripeAt);
});

test('delivery checkout still requires a compatible listing mode', () => {
  assert.equal(productSupportsRequestedDelivery('DELIVERY', 'LOCAL_PROVIDER'), true);
  assert.equal(productSupportsRequestedDelivery('BOTH', 'DELIVERY'), true);
  assert.equal(productSupportsRequestedDelivery('PICKUP', 'LOCAL_PROVIDER'), false);
  assert.equal(productSupportsRequestedDelivery('SHIPPING', 'DELIVERY'), false);
  assert.match(routeSource, /productSupportsRequestedDelivery\(/);
});

test('platform and courier percentages stay 12 and 88', () => {
  assert.equal(DEFAULT_PLATFORM_FEE_PERCENT, 12);
  assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
  assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
});
