import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAccountRequirements,
  missingRequirementsForAction,
} from '../account-requirements';
import { evaluateProfileRequirements } from './evaluate-profile-requirements';
import {
  aggregateRequirementNotice,
  isGenericProfileWarning,
  noticesForDeliveryMissing,
  recommendedProfileNotices,
} from './profile-requirement-notice';
import { humanAccountRequirementsMessage } from '../client/consume-account-requirements-response';
import { buildUserActionItems } from '../user/user-action-center';

const emptyStripe = { stripeConnectAccountId: null };

function actionCenterBase(over: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'u1',
      name: 'Ada',
      image: '/img.jpg',
      place: 'Rotterdam',
      emailVerified: new Date(),
      username: 'ada_r',
      termsAccepted: true,
      passwordHash: 'x',
      hcpWelcomeSeenAt: new Date(),
      ...((over.user as object) || {}),
    },
    roles: {
      hasSellerProfile: false,
      hasDeliveryProfile: false,
      hasAffiliate: false,
    },
    stripeSnapshot: emptyStripe,
    blockedProductsCount: 0,
    pendingSellerOrdersCount: 0,
    unreadMessagesCount: 0,
    buyerOrderUpdatesCount: 0,
    sellerOrderNotificationsCount: 0,
    unreadNotifications: [],
    activeDeliveryCount: 0,
    affiliate: null,
    pendingHcpRewards: [],
    ...over,
  };
}

describe('profile requirements engine — exact missing reasons', () => {
  const readyUser = {
    emailVerified: new Date(),
    username: 'chef_schiedam',
    termsAccepted: true,
    passwordHash: 'x',
    name: 'Sergio',
    image: '/photo.jpg',
    place: 'Schiedam',
    lat: 51.9,
    lng: 4.4,
  };

  it('complete account has no blocking notice', () => {
    const result = evaluateProfileRequirements({ user: readyUser, action: 'postItem' });
    assert.equal(result.isComplete, true);
    assert.equal(result.blockingRequirements.length, 0);
    assert.equal(result.recommendedRequirements.length, 0);
  });

  it('missing hometown is recommended, never blocking for listing', () => {
    const result = evaluateProfileRequirements({
      user: { ...readyUser, place: null, lat: null, lng: null },
      action: 'postItem',
    });
    assert.equal(result.isComplete, true);
    assert.equal(result.blockingRequirements.length, 0);
    assert.equal(result.recommendedRequirements.some((i) => i.code === 'location'), true);
    assert.match(result.notice?.titleNl || '', /woonplaats/i);
    assert.equal(result.notice?.ctaLabelNl, 'Woonplaats toevoegen');
    assert.equal(isGenericProfileWarning(result.notice?.titleNl), false);
    assert.equal(isGenericProfileWarning(result.notice?.ctaLabelNl), false);
  });

  it('missing username is blocking for postItem with exact CTA', () => {
    const result = evaluateProfileRequirements({
      user: { ...readyUser, username: 'temp_abc' },
      action: 'postItem',
    });
    assert.equal(result.isComplete, false);
    assert.deepEqual(
      result.blockingRequirements.map((i) => i.code),
      ['username'],
    );
    assert.equal(result.notice?.titleNl, 'Kies een definitieve gebruikersnaam.');
    assert.equal(result.notice?.ctaLabelNl, 'Gebruikersnaam kiezen');
    assert.equal(result.targetRoute, '/profile');
  });

  it('Stripe is not blocking for postItem', () => {
    const snap = getAccountRequirements({
      ...readyUser,
      stripeConnectAccountId: 'acct_incomplete',
      stripeConnectOnboardingCompleted: false,
    });
    assert.equal(snap.canPostItem, true);
    const missing = missingRequirementsForAction('postItem', snap.missing);
    assert.equal(missing.some((m) => m.key === 'stripeOnboarding'), false);
    const result = evaluateProfileRequirements({
      user: {
        ...readyUser,
        stripeConnectAccountId: 'acct_incomplete',
        stripeConnectOnboardingCompleted: false,
      },
      action: 'postItem',
    });
    assert.equal(result.isComplete, true);
    assert.equal(result.blockingRequirements.some((i) => i.code === 'stripeOnboarding'), false);
  });

  it('Stripe is blocking for sell', () => {
    const result = evaluateProfileRequirements({
      user: {
        ...readyUser,
        stripeConnectAccountId: 'acct_incomplete',
        stripeConnectOnboardingCompleted: false,
      },
      action: 'sell',
    });
    assert.equal(result.isComplete, false);
    assert.equal(result.blockingRequirements.some((i) => i.code === 'stripeOnboarding'), true);
    assert.match(result.notice?.titleNl || '', /uitbetalingsrekening/i);
  });

  it('multiple missing fields lists each onderdeel', () => {
    const result = evaluateProfileRequirements({
      user: {
        emailVerified: null,
        username: null,
        termsAccepted: false,
        name: '',
        image: null,
        place: null,
      },
      action: 'postItem',
    });
    assert.ok(result.blockingRequirements.length >= 3);
    assert.match(result.notice?.titleNl || '', /mist nog \d+ onderdelen/i);
    assert.match(result.notice?.bodyNl || '', /E-mailverificatie/);
    assert.match(result.notice?.bodyNl || '', /Gebruikersnaam/);
    assert.match(result.notice?.bodyNl || '', /Voorwaarden/);
    assert.equal(isGenericProfileWarning(result.notice?.titleNl), false);
  });

  it('delivery missing codes map to exact CTAs', () => {
    const notice = aggregateRequirementNotice(
      noticesForDeliveryMissing(['availability', 'pricing']),
    );
    assert.ok(notice);
    assert.match(notice!.titleNl, /mist nog 2 onderdelen/i);
    assert.match(notice!.bodyNl, /Bezorgtijden/);
    assert.match(notice!.bodyNl, /Bezorgtarief/);
    assert.equal(notice!.ctaLabelNl, 'Bezorgtijden instellen');
    assert.equal(isGenericProfileWarning(notice!.titleNl), false);
  });

  it('photo-only recommended uses exact copy', () => {
    const items = recommendedProfileNotices({
      name: 'Ada',
      image: null,
      place: 'Rotterdam',
      lat: 51.9,
      lng: 4.4,
    });
    const notice = aggregateRequirementNotice(items);
    assert.equal(items.length, 1);
    assert.equal(notice?.titleNl, 'Voeg een profielfoto toe om je profiel compleet te maken.');
    assert.equal(notice?.ctaLabelNl, 'Foto toevoegen');
  });

  it('human listing-gate message never says Profiel bijwerken', () => {
    const msg = humanAccountRequirementsMessage({
      missing: [
        {
          key: 'termsAccepted',
          label: 'Accepteer de algemene voorwaarden',
          actionHref: '/profile',
          titleNl: 'Accepteer de algemene voorwaarden.',
          bodyNl: 'Je moet de voorwaarden accepteren voordat je iets kunt aanbieden.',
          ctaLabelNl: 'Voorwaarden accepteren',
        },
      ],
      notice: {
        titleNl: 'Accepteer de algemene voorwaarden.',
        bodyNl: 'Je moet de voorwaarden accepteren voordat je iets kunt aanbieden.',
        ctaLabelNl: 'Voorwaarden accepteren',
      },
    });
    assert.match(msg, /voorwaarden/i);
    assert.equal(/Profiel bijwerken|Maak je profiel af/i.test(msg), false);
  });

  it('sidebar names missing hometown and hides generic titles', () => {
    const items = buildUserActionItems(
      actionCenterBase({
        user: {
          id: 'u1',
          name: 'Ada',
          image: '/img.jpg',
          place: null,
          lat: null,
          lng: null,
          emailVerified: new Date(),
          username: 'ada_r',
          termsAccepted: true,
          passwordHash: 'x',
          hcpWelcomeSeenAt: new Date(),
        },
      }) as never,
    );
    const profile = items.find((i) => i.id === 'profile-incomplete');
    assert.ok(profile);
    assert.match(profile!.title, /woonplaats/i);
    assert.equal(profile!.actionLabel, 'Woonplaats toevoegen');
    assert.equal(isGenericProfileWarning(profile!.title), false);
  });

  it('sidebar does not stack generic profile-incomplete on blocking account gaps', () => {
    const items = buildUserActionItems(
      actionCenterBase({
        user: {
          id: 'u1',
          name: null,
          image: null,
          place: null,
          emailVerified: null,
          username: null,
          termsAccepted: false,
          passwordHash: 'x',
          hcpWelcomeSeenAt: new Date(),
        },
      }) as never,
    );
    assert.ok(items.some((i) => i.id === 'account-incomplete'));
    assert.equal(items.some((i) => i.id === 'profile-incomplete'), false);
    const account = items.find((i) => i.id === 'account-incomplete');
    assert.match(account!.title, /mist nog \d+ onderdelen/i);
  });
});
