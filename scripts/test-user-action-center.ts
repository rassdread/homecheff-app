/**
 * Unit tests for lib/user/user-action-center.ts
 * Run: npx tsx scripts/test-user-action-center.ts
 */

import assert from 'node:assert/strict';
import { buildUserActionItems } from '../lib/user/user-action-center';

const baseUser = {
  id: 'user-1',
  name: 'Test User',
  image: '/img.jpg',
  place: 'Rotterdam',
  emailVerified: new Date(),
  username: 'testuser',
  termsAccepted: true,
  passwordHash: 'hash',
  hcpWelcomeSeenAt: new Date(),
};

const healthyStripe = {
  stripeConnectAccountId: 'acct_1',
  stripeConnectOnboardingCompleted: true,
  chargesEnabled: true,
  payoutsEnabled: true,
};

function testBuyerWithMessages() {
  const items = buildUserActionItems({
    user: baseUser,
    roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 2,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
  });
  assert.ok(items.some((i) => i.id === 'messages-unread'));
  assert.ok(!items.some((i) => i.id.startsWith('stripe')));
}

function testBuyerWithOrderUpdate() {
  const items = buildUserActionItems({
    user: baseUser,
    roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 1,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
  });
  assert.ok(items.some((i) => i.id === 'orders-buyer-update'));
}

function testSellerStripeBeforeMessages() {
  const items = buildUserActionItems({
    user: { ...baseUser, stripeConnectAccountId: null, stripeConnectOnboardingCompleted: false },
    roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 3,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
  });
  assert.equal(items[0].id, 'stripe-not-connected');
  assert.ok(items.some((i) => i.id === 'messages-unread'));
  assert.ok(items[0].severity === 'red');
}

function testSellerNoStripeForBuyer() {
  const items = buildUserActionItems({
    user: baseUser,
    roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
  });
  assert.equal(items.length, 0);
}

function testDeliveryActive() {
  const items = buildUserActionItems({
    user: baseUser,
    roles: { hasSellerProfile: false, hasDeliveryProfile: true, hasAffiliate: false },
    stripeSnapshot: healthyStripe,
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    deliveryProfile: { id: 'dp-1', isVerified: true },
    activeDeliveryCount: 1,
    pendingHcpRewards: [],
  });
  assert.ok(items.some((i) => i.id === 'delivery-active'));
}

function testAffiliatePayout() {
  const items = buildUserActionItems({
    user: baseUser,
    roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: true },
    stripeSnapshot: healthyStripe,
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    affiliate: { status: 'ACTIVE', availableCents: 2500, recentSubAffiliateCount: 0 },
    pendingHcpRewards: [],
  });
  assert.ok(items.some((i) => i.id === 'affiliate-payout-available'));
}

testBuyerWithMessages();
testBuyerWithOrderUpdate();
testSellerStripeBeforeMessages();
testSellerNoStripeForBuyer();
testDeliveryActive();
testAffiliatePayout();
console.log('test-user-action-center: all passed');
