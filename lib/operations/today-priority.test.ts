import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveTodayEmptyNextAction,
  selectTodayActionItems,
} from './today-priority';
import {
  buildUserActionItems,
  proposalWaitsOnCurrentUser,
  type UserActionCenterInput,
} from '@/lib/user/user-action-center';

const user = {
  id: 'user-1',
  name: 'Ada',
  image: '/a.jpg',
  place: 'Utrecht',
  emailVerified: new Date(),
  username: 'ada',
  termsAccepted: true,
  passwordHash: 'hash',
  hcpWelcomeSeenAt: new Date(),
};

const readyStripe = {
  stripeConnectAccountId: 'acct_1',
  stripeConnectOnboardingCompleted: true,
  chargesEnabled: true,
  payoutsEnabled: true,
};

const noStripe = { stripeConnectAccountId: null };

function input(
  patch: Partial<UserActionCenterInput> & {
    roles: UserActionCenterInput['roles'];
  },
): UserActionCenterInput {
  return {
    user,
    stripeSnapshot: readyStripe,
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    pendingHcpRewards: [],
    incomingProposalsWaitingCount: 0,
    ...patch,
  };
}

function top(items: ReturnType<typeof buildUserActionItems>) {
  return selectTodayActionItems(items)[0]?.id ?? null;
}

describe('Today priority', () => {
  it('does not treat payout setup as urgent when nothing is blocked', () => {
    const items = buildUserActionItems(
      input({
        user: { ...user, stripeConnectAccountId: null },
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        stripeSnapshot: noStripe,
        unreadMessagesCount: 2,
      }),
    );
    assert.equal(top(items), 'messages-unread');
    assert.equal(items.some((item) => item.id.startsWith('stripe')), false);
  });

  it('puts payout setup first when a listing cannot be sold', () => {
    const items = buildUserActionItems(
      input({
        user: { ...user, stripeConnectAccountId: null },
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        stripeSnapshot: noStripe,
        blockedProductsCount: 1,
        unreadMessagesCount: 1,
      }),
    );
    assert.equal(top(items), 'stripe-not-connected');
    assert.ok(selectTodayActionItems(items).some((item) => item.id === 'messages-unread'));
  });

  it('keeps an incoming proposal and ignores the one I sent', () => {
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'PENDING',
        createdById: 'buyer',
        sellerId: 'me',
        buyerId: 'buyer',
        userId: 'me',
      }),
      true,
    );
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'PENDING',
        createdById: 'me',
        sellerId: 'me',
        buyerId: 'buyer',
        userId: 'me',
      }),
      false,
    );
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'REJECTED',
        createdById: 'buyer',
        sellerId: 'me',
        buyerId: 'buyer',
        userId: 'me',
      }),
      false,
    );
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        incomingProposalsWaitingCount: 1,
      }),
    );
    assert.equal(top(items), 'proposals-incoming');
  });

  it('ranks a live delivery above a quiet seller profile', () => {
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: true, hasAffiliate: true },
        deliveryProfile: { id: 'dp', isVerified: true, activationComplete: true },
        activeDeliveryCount: 1,
        affiliate: { status: 'ACTIVE', availableCents: 0, recentSubAffiliateCount: 2 },
      }),
    );
    assert.equal(top(items), 'delivery-active');
    assert.equal(
      selectTodayActionItems(items).some((item) => item.id === 'affiliate-new-sub'),
      false,
    );
  });

  it('does not invent work for a buyer, inspiration, or request-only account', () => {
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
        stripeSnapshot: noStripe,
      }),
    );
    assert.equal(selectTodayActionItems(items).length, 0);
    assert.equal(
      deriveTodayEmptyNextAction({ role: 'BUYER', sellerRoles: [] }).id,
      'marketplace',
    );
    assert.equal(
      deriveTodayEmptyNextAction({ role: 'USER', sellerRoles: [] }).href,
      '/',
    );
  });

  it('gives a quiet service provider one listings action, not a chef task', () => {
    const next = deriveTodayEmptyNextAction({
      role: 'BUYER',
      sellerRoles: ['service'],
      hasActiveServiceOffer: true,
      hasActiveProductOffer: false,
    });
    assert.equal(next.id, 'my-services');
    assert.equal(next.href, '/profile?tab=aanbod');
  });

  it('composes chef and service into one listings action', () => {
    const next = deriveTodayEmptyNextAction({
      role: 'SELLER',
      sellerRoles: ['chef', 'service'],
      hasAffiliate: true,
    });
    assert.equal(next.id, 'my-offer');
  });

  it('points a quiet affiliate at their link and a quiet courier at deliveries', () => {
    assert.equal(
      deriveTodayEmptyNextAction({ hasAffiliate: true, sellerRoles: [] }).href,
      '/affiliate',
    );
    assert.equal(
      deriveTodayEmptyNextAction({
        role: 'DELIVERY',
        hasDeliveryProfile: true,
        sellerRoles: [],
      }).href,
      '/delivery',
    );
  });

  it('drops profile polish and reputation from the action queue', () => {
    const items = buildUserActionItems(
      input({
        user: { ...user, image: null, hcpWelcomeSeenAt: null },
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
      }),
    );
    assert.ok(items.some((item) => item.id === 'hcp-welcome' || item.id === 'profile-incomplete'));
    assert.equal(selectTodayActionItems(items).length, 0);
  });
});
