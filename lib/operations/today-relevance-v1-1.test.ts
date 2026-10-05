import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { postAcceptDetailsWaitOnUser } from '@/lib/proposals/fulfillment-location';
import {
  deriveTodayEmptyNextAction,
  selectTodayActionItems,
} from '@/lib/operations/today-priority';
import {
  buildUserActionItems,
  proposalWaitsOnCurrentUser,
  type UserActionCenterInput,
  type UserActionItem,
} from '@/lib/user/user-action-center';

const ME = 'me';
const OTHER = 'other';

const user = {
  id: ME,
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

const ADDRESS = 'Kerkstraat 12, Utrecht';
const WHEN = { proposalDate: '2026-10-12', proposalTimeWindow: '14:00-16:00' };

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

function task(
  items: UserActionItem[],
  id: string,
): UserActionItem | undefined {
  return selectTodayActionItems(items).find((item) => item.id === id);
}

function ownership(
  patch: Partial<Parameters<typeof postAcceptDetailsWaitOnUser>[0]> = {},
) {
  return postAcceptDetailsWaitOnUser({
    userId: ME,
    buyerId: OTHER,
    sellerId: ME,
    status: 'OPEN',
    fulfillmentMode: 'PICKUP',
    ...patch,
  });
}

describe('post-accept ownership', () => {
  it('asks me for the address when I am the pickup owner', () => {
    const result = ownership({ pickupAddress: null, ...WHEN });
    assert.equal(result.waiting, true);
    assert.equal(result.state, 'LOCATION_PENDING');
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-1',
          state: 'LOCATION_PENDING',
        },
      }),
    );
    const card = task(items, 'post-accept-details');
    assert.ok(card);
    assert.equal(card?.severity, 'orange');
    assert.equal(card?.actionHref, '/profile/deals?highlight=order-1');
    assert.match(card?.title || '', /adres/i);
    const english = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        language: 'en',
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-1',
          state: 'LOCATION_PENDING',
        },
      }),
    );
    assert.match(task(english, 'post-accept-details')?.title || '', /address/i);
    assert.doesNotMatch(task(english, 'post-accept-details')?.title || '', /adres|afspraak/i);
  });

  it('stays quiet when the other party owes the address', () => {
    const result = ownership({
      userId: ME,
      buyerId: ME,
      sellerId: OTHER,
      fulfillmentMode: 'PICKUP',
      pickupAddress: null,
      ...WHEN,
    });
    assert.equal(result.waiting, false);
  });

  it('asks me for the time when I am the owner and the address is already set', () => {
    const result = ownership({ pickupAddress: ADDRESS });
    assert.equal(result.waiting, true);
    assert.equal(result.state, 'SCHEDULE_PENDING');
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-time',
          state: 'SCHEDULE_PENDING',
        },
      }),
    );
    assert.match(task(items, 'post-accept-details')?.title || '', /tijd/i);
    const english = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
        language: 'en',
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-time',
          state: 'SCHEDULE_PENDING',
        },
      }),
    );
    assert.match(task(english, 'post-accept-details')?.title || '', /time/i);
  });

  it('stays quiet when the other party owes the time', () => {
    const result = ownership({
      fulfillmentMode: 'DELIVERY',
      deliveryAddress: ADDRESS,
    });
    assert.equal(result.waiting, false);
    assert.equal(result.state, 'SCHEDULE_PENDING');
  });

  it('creates one task when I owe both address and time', () => {
    const result = ownership({
      buyerId: ME,
      sellerId: OTHER,
      fulfillmentMode: 'DELIVERY',
      deliveryAddress: null,
    });
    assert.equal(result.waiting, true);
    assert.equal(result.state, 'LOCATION_AND_SCHEDULE_PENDING');
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-both',
          state: 'LOCATION_AND_SCHEDULE_PENDING',
        },
      }),
    );
    const queued = selectTodayActionItems(items);
    assert.equal(queued.filter((item) => item.id === 'post-accept-details').length, 1);
    assert.equal(queued.length, 1);
    assert.match(queued[0].title, /compleet/i);
    const english = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: false },
        language: 'en',
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-both',
          state: 'LOCATION_AND_SCHEDULE_PENDING',
        },
      }),
    );
    assert.match(task(english, 'post-accept-details')?.title || '', /Finish the appointment/i);
  });

  it('creates no task when the appointment is already complete', () => {
    const result = ownership({ pickupAddress: ADDRESS, ...WHEN });
    assert.equal(result.waiting, false);
    assert.equal(result.state, 'COMPLETE');
  });

  it('creates no task for a closed or digital agreement', () => {
    assert.equal(
      ownership({ status: 'CANCELLED', pickupAddress: null }).waiting,
      false,
    );
    assert.equal(
      ownership({ status: 'COMPLETED', pickupAddress: null }).waiting,
      false,
    );
    assert.equal(
      ownership({ fulfillmentMode: 'DIGITAL', pickupAddress: null }).waiting,
      false,
    );
  });
});

describe('Today state matrix', () => {
  const quiet = {
    hasSellerProfile: false,
    hasDeliveryProfile: false,
    hasAffiliate: false,
  };

  it('keeps an incoming proposal and ignores outgoing and rejected ones', () => {
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'PENDING',
        createdById: OTHER,
        sellerId: ME,
        buyerId: OTHER,
        userId: ME,
      }),
      true,
    );
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'PENDING',
        createdById: ME,
        sellerId: ME,
        buyerId: OTHER,
        userId: ME,
      }),
      false,
    );
    assert.equal(
      proposalWaitsOnCurrentUser({
        status: 'REJECTED',
        createdById: OTHER,
        sellerId: ME,
        buyerId: OTHER,
        userId: ME,
      }),
      false,
    );
    const incoming = buildUserActionItems(
      input({ roles: quiet, incomingProposalsWaitingCount: 1 }),
    );
    assert.equal(task(incoming, 'proposals-incoming')?.actionHref, '/profile/deals');
    const none = buildUserActionItems(
      input({ roles: quiet, incomingProposalsWaitingCount: 0 }),
    );
    assert.equal(task(none, 'proposals-incoming'), undefined);
  });

  it('shows an unread incoming message and nothing for my own latest message', () => {
    const items = buildUserActionItems(
      input({
        roles: quiet,
        unreadMessagesCount: 1,
        entityHints: { firstUnreadConversationSenderName: 'Noor' },
      }),
    );
    const card = task(items, 'messages-unread');
    assert.match(card?.title || '', /Noor/);
    assert.equal(card?.actionLabel, 'Gesprek openen');
    const mine = buildUserActionItems(input({ roles: quiet, unreadMessagesCount: 0 }));
    assert.equal(task(mine, 'messages-unread'), undefined);
  });

  it('writes the same tasks in English when the UI language is English', () => {
    const items = buildUserActionItems(
      input({
        roles: {
          hasSellerProfile: true,
          hasDeliveryProfile: true,
          hasAffiliate: true,
        },
        language: 'en',
        unreadMessagesCount: 2,
        buyerOrderUpdatesCount: 1,
        incomingProposalsWaitingCount: 1,
        blockedProductsCount: 1,
        stripeSnapshot: { stripeConnectAccountId: null },
        user: { ...user, stripeConnectAccountId: null },
        deliveryProfile: { id: 'dp', isVerified: true, activationComplete: true },
        activeDeliveryCount: 1,
        affiliate: { status: 'ACTIVE', availableCents: 2500, recentSubAffiliateCount: 1 },
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-en',
          state: 'LOCATION_PENDING',
        },
      }),
    );
    const queued = selectTodayActionItems(items);
    const byId = Object.fromEntries(queued.map((item) => [item.id, item]));
    assert.match(byId['messages-unread'].title, /unread messages/i);
    assert.match(byId['orders-buyer-update'].title, /order update/i);
    assert.match(byId['stripe-not-connected'].title, /payout account/i);
    assert.match(byId['proposals-incoming'].title, /proposal/i);
    assert.match(byId['post-accept-details'].title, /address/i);
    assert.match(byId['delivery-active'].title, /delivery in progress/i);
    assert.match(byId['affiliate-payout-available'].title, /payout/i);
    for (const item of queued) {
      assert.doesNotMatch(
        `${item.title} ${item.description} ${item.actionLabel}`,
        /\b(je|jij|wacht|voorstel|bestelling|bezorg|afspraak|berichten|uitbetaling)\b/i,
      );
    }
    const ids = queued.map((item) => item.id);
    assert.equal(ids[0], 'stripe-not-connected');
    assert.ok(ids.indexOf('delivery-active') < ids.indexOf('post-accept-details'));
  });

  it('puts a blocked payout ahead of a message', () => {
    const items = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        stripeSnapshot: { stripeConnectAccountId: null },
        user: { ...user, stripeConnectAccountId: null },
        blockedProductsCount: 2,
        unreadMessagesCount: 1,
      }),
    );
    assert.equal(selectTodayActionItems(items)[0].id, 'stripe-not-connected');
    assert.match(selectTodayActionItems(items)[0].title, /Betaalaccount/);
  });

  it('does not push a quiet seller, service, or affiliate into invented work', () => {
    const seller = buildUserActionItems(
      input({
        roles: { hasSellerProfile: true, hasDeliveryProfile: false, hasAffiliate: false },
        stripeSnapshot: { stripeConnectAccountId: null },
        user: { ...user, stripeConnectAccountId: null },
      }),
    );
    assert.equal(selectTodayActionItems(seller).some((item) => item.id.startsWith('stripe')), false);
    assert.equal(
      deriveTodayEmptyNextAction({ role: 'SELLER', sellerRoles: ['chef'] }).id,
      'my-offer',
    );
    assert.equal(
      deriveTodayEmptyNextAction({ sellerRoles: ['service'], hasActiveServiceOffer: true }).id,
      'my-services',
    );
    const affiliate = buildUserActionItems(
      input({
        roles: { hasSellerProfile: false, hasDeliveryProfile: false, hasAffiliate: true },
        affiliate: { status: 'ACTIVE', availableCents: 0, recentSubAffiliateCount: 1 },
      }),
    );
    assert.equal(selectTodayActionItems(affiliate).length, 0);
    assert.equal(
      affiliate.some((item) => item.id === 'first-referral' || item.id === 'affiliate-first-referral'),
      false,
    );
    assert.equal(
      deriveTodayEmptyNextAction({ hasAffiliate: true, sellerRoles: [] }).href,
      '/affiliate',
    );
  });

  it('keeps post-accept work above lower-priority polish and below a live delivery', () => {
    const items = buildUserActionItems(
      input({
        user: { ...user, image: null, hcpWelcomeSeenAt: null },
        roles: { hasSellerProfile: true, hasDeliveryProfile: true, hasAffiliate: true },
        deliveryProfile: { id: 'dp', isVerified: true, activationComplete: true },
        activeDeliveryCount: 1,
        incomingProposalsWaitingCount: 1,
        affiliate: { status: 'ACTIVE', availableCents: 0, recentSubAffiliateCount: 3 },
        postAcceptWaiting: {
          count: 1,
          communityOrderId: 'order-multi',
          state: 'SCHEDULE_PENDING',
        },
      }),
    );
    const queued = selectTodayActionItems(items).map((item) => item.id);
    assert.deepEqual(queued, [
      'delivery-active',
      'post-accept-details',
      'proposals-incoming',
    ]);
    assert.equal(queued.includes('profile-incomplete'), false);
    assert.equal(queued.includes('affiliate-new-sub'), false);
    assert.equal(queued.includes('hcp-welcome'), false);
  });
});

describe('Today request scope', () => {
  it('asks Today only for the live delivery snapshot', () => {
    const source = readFileSync(
      new URL('../../components/operations/today/OperationsTodayContent.tsx', import.meta.url),
      'utf8',
    );
    assert.match(source, /seller:\s*false/);
    assert.match(source, /partner:\s*false/);
    assert.match(source, /delivery:\s*true/);
    const hook = readFileSync(
      new URL('../../hooks/useOperationsTodayRoleData.ts', import.meta.url),
      'utf8',
    );
    assert.match(hook, /includeSeller && hasSeller/);
    assert.match(hook, /includePartner && hasAffiliate/);
    assert.match(hook, /includeDelivery && hasDelivery/);
    const hub = readFileSync(
      new URL('../../hooks/useMyHomeCheffHubData.ts', import.meta.url),
      'utf8',
    );
    assert.match(hub, /useOperationsTodayRoleData\(ctx, enabled\)/);
  });
});
