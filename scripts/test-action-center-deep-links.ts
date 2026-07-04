/**
 * Unit tests for P0 action center deep links.
 * Run: npx tsx scripts/test-action-center-deep-links.ts
 */

import assert from 'node:assert/strict';
import { buildSellerActionItems } from '../lib/seller/seller-action-center';
import { buildUserActionItems } from '../lib/user/user-action-center';
import { resolveEntityHrefs } from '../lib/action-center/fetch-action-center-entities';

const entityHints = {
  firstUnreadConversationId: 'conv-abc',
  firstUnreadConversationSenderName: 'Lioness',
  firstPendingOrderId: 'order-241',
  firstPendingOrderNumber: '241',
  firstBlockedProductId: 'prod-keksi',
  firstBlockedProductTitle: 'Keksi',
  firstSellerOrderNotificationHref: '/verkoper/orders?highlight=order-99',
  firstSellerOrderNotificationOrderNumber: '99',
};

function testResolveEntityHrefs() {
  const hrefs = resolveEntityHrefs(entityHints);
  assert.equal(hrefs.messagesHref, '/messages?conversation=conv-abc');
  assert.equal(hrefs.pendingOrderHref, '/verkoper/orders?highlight=order-241');
  assert.equal(hrefs.blockedProductHref, '/product/prod-keksi/edit');
  assert.equal(hrefs.sellerOrderNotifHref, '/verkoper/orders?highlight=order-99');
}

function testSellerDeepLinks() {
  const items = buildSellerActionItems({
    user: {
      id: 'u1',
      emailVerified: new Date(),
      username: 'maker',
      termsAccepted: true,
      passwordHash: 'x',
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    blockedProductsCount: 1,
    pendingOrdersCount: 1,
    unreadMessagesCount: 1,
    sellerUnreadOrdersCount: 1,
    includeOrange: true,
    entityHints,
  });

  const blocked = items.find((i) => i.id === 'products-blocked-payments');
  assert.ok(blocked);
  assert.equal(blocked!.actionHref, '/product/prod-keksi/edit');
  assert.match(blocked!.title, /Keksi/);

  const pending = items.find((i) => i.id === 'orders-pending');
  assert.ok(pending);
  assert.equal(pending!.actionHref, '/verkoper/orders?highlight=order-241');
  assert.match(pending!.title, /#241/);

  const messages = items.find((i) => i.id === 'messages-unread');
  assert.ok(messages);
  assert.equal(messages!.actionHref, '/messages?conversation=conv-abc');
  assert.match(messages!.title, /Lioness/);

  const orderNotif = items.find((i) => i.id === 'orders-notification');
  assert.ok(orderNotif);
  assert.equal(orderNotif!.actionHref, '/verkoper/orders?highlight=order-99');
}

function testStripeOnboardKind() {
  const items = buildSellerActionItems({
    user: {
      id: 'u1',
      emailVerified: new Date(),
      username: 'maker',
      termsAccepted: true,
      passwordHash: 'x',
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: false,
    },
    stripeSnapshot: {
      stripeConnectAccountId: 'acct_1',
      stripeConnectOnboardingCompleted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    },
    blockedProductsCount: 0,
    pendingOrdersCount: 0,
    includeOrange: false,
  });
  assert.equal(items[0].id, 'stripe-onboarding-incomplete');
  assert.equal(items[0].actionKind, 'stripe-onboard');
}

function testBuyerMessagesDeepLink() {
  const items = buildUserActionItems({
    user: {
      id: 'u1',
      name: 'Buyer',
      image: '/a.jpg',
      place: 'Amsterdam',
      emailVerified: new Date(),
      username: 'buyer',
      termsAccepted: true,
      passwordHash: 'x',
      hcpWelcomeSeenAt: new Date(),
    },
    roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
    stripeSnapshot: { stripeConnectAccountId: null },
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 1,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
    entityHints,
  });
  const messages = items.find((i) => i.id === 'messages-unread');
  assert.ok(messages);
  assert.equal(messages!.actionHref, '/messages?conversation=conv-abc');
}

testResolveEntityHrefs();
testSellerDeepLinks();
testStripeOnboardKind();
testBuyerMessagesDeepLink();
console.log('test-action-center-deep-links: all passed');
