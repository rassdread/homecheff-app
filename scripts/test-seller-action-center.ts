/**
 * Unit tests for lib/seller/seller-action-center.ts
 * Run: npx tsx scripts/test-seller-action-center.ts
 */

import assert from 'node:assert/strict';
import { buildSellerActionItems } from '../lib/seller/seller-action-center';

const baseUser = {
  id: 'user-1',
  emailVerified: new Date(),
  username: 'maker',
  termsAccepted: true,
  passwordHash: 'hash',
  stripeConnectAccountId: null,
  stripeConnectOnboardingCompleted: false,
};

function testStripeNotConnected() {
  const items = buildSellerActionItems({
    user: baseUser,
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 2,
    pendingOrdersCount: 0,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'stripe-not-connected');
  assert.equal(items[0].severity, 'red');
}

function testStripeIncompleteNoDuplicateProducts() {
  const items = buildSellerActionItems({
    user: {
      ...baseUser,
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: false,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    },
    blockedProductsCount: 3,
    pendingOrdersCount: 0,
  });
  assert.equal(items[0].id, 'stripe-onboarding-incomplete');
  assert.ok(!items.some((i) => i.id === 'products-blocked-payments'));
}

function testBlockedProductsWhenPaymentsReady() {
  const items = buildSellerActionItems({
    user: {
      ...baseUser,
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    blockedProductsCount: 2,
    pendingOrdersCount: 0,
  });
  assert.ok(items.some((i) => i.id === 'products-blocked-payments'));
  assert.equal(items.filter((i) => i.id.startsWith('stripe')).length, 0);
}

function testAccountIncomplete() {
  const items = buildSellerActionItems({
    user: {
      ...baseUser,
      termsAccepted: false,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    blockedProductsCount: 0,
    pendingOrdersCount: 0,
  });
  assert.ok(items.some((i) => i.id === 'account-incomplete'));
  assert.ok(!items.some((i) => i.id === 'stripe-not-connected'));
}

function testPendingOrders() {
  const items = buildSellerActionItems({
    user: {
      ...baseUser,
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    blockedProductsCount: 0,
    pendingOrdersCount: 2,
  });
  const order = items.find((i) => i.id === 'orders-pending');
  assert.ok(order);
  assert.match(order!.title, /2 bestellingen/);
}

function testHealthySeller() {
  const items = buildSellerActionItems({
    user: {
      ...baseUser,
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    blockedProductsCount: 0,
    pendingOrdersCount: 0,
  });
  assert.equal(items.length, 0);
}

function testRedBeforeOrange() {
  const items = buildSellerActionItems({
    user: baseUser,
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingOrdersCount: 1,
    unreadMessagesCount: 5,
    includeOrange: true,
  });
  assert.equal(items[0].severity, 'red');
  assert.ok(items.some((i) => i.severity === 'orange'));
}

testStripeNotConnected();
testStripeIncompleteNoDuplicateProducts();
testBlockedProductsWhenPaymentsReady();
testAccountIncomplete();
testPendingOrders();
testHealthySeller();
testRedBeforeOrange();
console.log('test-seller-action-center: all passed');
