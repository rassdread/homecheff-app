import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { deriveConnectAccountStatusFromDb } from '@/lib/stripe/connect-account-status';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';
import {
  DELIVERY_AGREEMENT_VERSION,
  agreementState,
  checkedRecipients,
  inclusionReasons,
  matchesAudience,
  selectionCanList,
  parseAudienceSelection,
  auditMetaHasConnectAccount,
  payoutConnectStatus,
  payoutConnectStatusLabel,
  stripeLinkNeedsReview,
  stripeStatusMatches,
  countStripeStatuses,
  stripeCountLines,
  explicitReviewBlock,
  requiresExplicitStripeCheck,
  previewCanonicalPayload,
  type AudienceCandidate,
  type AudienceSelection,
} from '@/lib/admin/notification-audience';
import {
  __resetBroadcastFlightForTests,
  claimBroadcastFlight,
  emailAttemptNumber,
  emailLedgerStatus,
  formatBroadcastResult,
  ledgerAfterEmail,
  ledgerAfterPush,
  planEmail,
  planInApp,
  planPush,
  releaseBroadcastFlight,
} from '@/lib/admin/broadcast-delivery-plan';
import { visibleBulkFeedbackLines } from '@/lib/email/admin-bulk-delivery';

function user(partial: Partial<AudienceCandidate> & Pick<AudienceCandidate, 'id'>): AudienceCandidate {
  return {
    email: `${partial.id}@homecheff-validation.test`,
    name: partial.id,
    username: partial.id,
    role: 'USER',
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    accountDeletedAt: null,
    suspendedAt: null,
    emailVerified: new Date('2020-01-02T00:00:00.000Z'),
    buyerRoles: [],
    sellerRoles: [],
    stripeConnectAccountId: null,
    stripeConnectOnboardingCompleted: false,
    hasSellerProfile: false,
    commerceReviewState: null,
    delivery: null,
    pushReachable: false,
    ...partial,
  };
}

const deliveryOpen = {
  isVerified: false,
  isBlocked: false,
  isActive: false,
  agreementAcceptedAt: null,
  agreementDocumentId: null,
  activationMissing: ['pricing'] as string[],
};

function selection(partial: Partial<AudienceSelection> & Pick<AudienceSelection, 'audience'>): AudienceSelection {
  return {
    match: 'all',
    stripe: null,
    verification: null,
    agreementVersion: null,
    accountStatus: null,
    pendingStep: null,
    excludeUserIds: [],
    ...partial,
  };
}

describe('payout connect status', () => {
  it('uses the same three database states as Connect onvolledig', () => {
    const cases = [
      { stripeConnectAccountId: null, stripeConnectOnboardingCompleted: false, status: 'none' as const },
      { stripeConnectAccountId: 'acct_test', stripeConnectOnboardingCompleted: false, status: 'incomplete' as const },
      { stripeConnectAccountId: 'acct_test', stripeConnectOnboardingCompleted: true, status: 'ready' as const },
    ];
    for (const item of cases) {
      assert.equal(payoutConnectStatus(item), item.status);
      const ui = deriveConnectAccountStatusFromDb(item).uiStatus;
      const fromDb = ui === 'NOT_STARTED' ? 'none' : ui === 'INCOMPLETE' ? 'incomplete' : ui === 'PAYMENT_READY' ? 'ready' : 'other';
      assert.equal(fromDb, item.status);
    }
    assert.equal(payoutConnectStatusLabel('incomplete'), 'Connect onvolledig');
    assert.equal(deriveConnectAccountStatusFromDb({ stripeConnectAccountId: 'acct_test', stripeConnectOnboardingCompleted: false }).uiStatus, 'INCOMPLETE');
  });
});

describe('targeted audiences', () => {
  const sellerCourier = user({
    id: 'seller-courier',
    role: 'SELLER',
    sellerRoles: ['chef'],
    hasSellerProfile: true,
    stripeConnectAccountId: 'acct_seller_courier',
    stripeConnectOnboardingCompleted: false,
    delivery: deliveryOpen,
    createdAt: new Date('2019-01-01T00:00:00.000Z'),
  });
  const sellerNoAccount = user({
    id: 'seller-none',
    role: 'DELIVERY',
    sellerRoles: ['garden'],
    hasSellerProfile: true,
    delivery: { ...deliveryOpen, agreementAcceptedAt: new Date(), agreementDocumentId: DELIVERY_AGREEMENT_VERSION, activationMissing: [] },
  });
  const sellerReady = user({
    id: 'seller-ready',
    role: 'SELLER',
    hasSellerProfile: true,
    stripeConnectAccountId: 'acct_ready',
    stripeConnectOnboardingCompleted: true,
  });
  const buyer = user({
    id: 'buyer-old',
    role: 'BUYER',
    buyerRoles: ['explorer'],
    createdAt: new Date('2018-01-01T00:00:00.000Z'),
    emailVerified: null,
  });
  const courierOnlyNone = user({
    id: 'courier-none',
    role: 'BUYER',
    delivery: { ...deliveryOpen, activationMissing: null },
  });

  it('keeps incomplete connect apart from no account, including dual roles', () => {
    const incomplete = selection({ audience: 'delivery', stripe: 'incomplete' });
    const none = selection({ audience: 'sellers', stripe: 'none' });
    assert.equal(matchesAudience(sellerCourier, incomplete), true);
    assert.equal(matchesAudience(sellerNoAccount, incomplete), false);
    assert.equal(matchesAudience(sellerReady, incomplete), false);
    assert.equal(matchesAudience(courierOnlyNone, incomplete), false);
    assert.equal(matchesAudience(sellerNoAccount, none), true);
    assert.equal(matchesAudience(sellerCourier, none), false);
    assert.equal(matchesAudience(sellerReady, none), false);
    assert.equal(matchesAudience(courierOnlyNone, none), false);
  });

  it('does not treat registration date, offline or a missing profile as the requested task', () => {
    assert.equal(matchesAudience(buyer, selection({ audience: 'buyers' })), true);
    assert.equal(parseAudienceSelection({ audience: 'buyers', activityDays: 60 }).ok, false);
    assert.equal(parseAudienceSelection({ audience: 'buyers', activityDays: 'none_recorded' }).ok, false);
    assert.equal(parseAudienceSelection({ audience: '' }).ok, false);
    assert.equal(matchesAudience(sellerCourier, selection({ audience: 'delivery', accountStatus: 'active' })), true);
    assert.equal(sellerCourier.delivery?.isActive, false);
    assert.equal(matchesAudience(courierOnlyNone, selection({ audience: 'delivery', pendingStep: 'delivery_pricing' })), false);
    assert.equal(matchesAudience(sellerCourier, selection({ audience: 'delivery', pendingStep: 'delivery_pricing' })), true);
    assert.equal(agreementState(user({ id: 'no-profile' })), 'not_applicable');
  });

  it('keeps agreement version separate from stripe and from an acceptance without a version', () => {
    const open = selection({ audience: 'delivery', agreementVersion: DELIVERY_AGREEMENT_VERSION });
    assert.equal(matchesAudience(sellerCourier, open), true);
    assert.equal(matchesAudience(sellerNoAccount, open), false);
    const unknown = user({
      id: 'unknown-agreement',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date(),
        agreementDocumentId: null,
      },
    });
    assert.equal(agreementState(unknown), 'unknown_version');
    assert.equal(matchesAudience(unknown, open), false);
    const oldVersion = user({
      id: 'old-agreement',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date(),
        agreementDocumentId: 'old-version',
      },
    });
    assert.equal(matchesAudience(oldVersion, open), true);
    const both = selection({
      audience: 'delivery',
      match: 'all',
      stripe: 'incomplete',
      agreementVersion: DELIVERY_AGREEMENT_VERSION,
    });
    assert.equal(matchesAudience(sellerCourier, both), true);
    assert.equal(matchesAudience(oldVersion, both), false);
    const either = { ...both, match: 'any' as const, stripe: 'ready' as const };
    assert.equal(matchesAudience(sellerCourier, either), true);
    assert.equal(matchesAudience(sellerReady, either), false);
  });

  it('keeps HomeCheff verification apart from Stripe and does not invent pending', () => {
    assert.equal(matchesAudience(buyer, selection({ audience: 'buyers', verification: { kind: 'email', status: 'unverified' } })), true);
    assert.equal(matchesAudience(sellerCourier, selection({ audience: 'sellers', verification: { kind: 'email', status: 'unverified' } })), false);
    assert.equal(parseAudienceSelection({ audience: 'buyers', verification: { kind: 'email', status: 'pending' } }).ok, false);
    assert.equal(parseAudienceSelection({ audience: 'delivery', verification: { kind: 'courier', status: 'pending' } }).ok, false);
    const reviewed = user({ id: 'reviewed', role: 'SELLER', hasSellerProfile: true, commerceReviewState: 'REVIEWED' });
    const reviewPending = user({ id: 'review-pending', role: 'SELLER', hasSellerProfile: true, commerceReviewState: 'UNDER_REVIEW' });
    const undeclared = user({ id: 'undeclared', role: 'SELLER', hasSellerProfile: true, commerceReviewState: 'NONE' });
    assert.equal(matchesAudience(reviewPending, selection({ audience: 'sellers', verification: { kind: 'commerce_review', status: 'pending' } })), true);
    assert.equal(matchesAudience(reviewed, selection({ audience: 'sellers', verification: { kind: 'commerce_review', status: 'pending' } })), false);
    assert.equal(matchesAudience(undeclared, selection({ audience: 'sellers', verification: { kind: 'commerce_review', status: 'unverified' } })), false);
    const noProfile = user({ id: 'role-only', role: 'DELIVERY' });
    assert.equal(matchesAudience(noProfile, selection({ audience: 'delivery', verification: { kind: 'courier', status: 'unverified' } })), false);
  });

  it('blocks empty, deleted, staff and manual exclusions', () => {
    assert.equal(matchesAudience(user({ id: 'deleted', role: 'BUYER', accountDeletedAt: new Date() }), selection({ audience: 'buyers' })), false);
    assert.equal(matchesAudience(user({ id: 'admin', role: 'ADMIN' }), selection({ audience: 'all' })), false);
    assert.equal(matchesAudience(buyer, selection({ audience: 'buyers', excludeUserIds: [buyer.id] })), false);
    assert.equal(matchesAudience(user({ id: 'blocked', role: 'BUYER', suspendedAt: new Date() }), selection({ audience: 'buyers', accountStatus: 'blocked' })), true);
    assert.equal(matchesAudience(user({ id: 'blocked', role: 'BUYER', suspendedAt: new Date() }), selection({ audience: 'buyers', accountStatus: 'active' })), false);
  });

  it('changes the preview token when the selection changes', () => {
    const base = {
      selection: selection({ audience: 'sellers' as const, stripe: 'none' }),
      message: 'hallo test',
      subject: 'test',
      title: 'test',
      route: '/notifications',
      sendNotification: true,
      sendEmail: false,
      confirmRepeat: false,
      recipientIds: ['seller-none'],
    };
    const first = previewCanonicalPayload(base);
    const excluded = previewCanonicalPayload({
      ...base,
      selection: { ...base.selection, excludeUserIds: ['seller-none'] },
      recipientIds: [],
    });
    assert.notEqual(first, excluded);
  });

  it('sends only checked users and explains why the others are listed', () => {
    const stripeSelection = selection({ audience: 'sellers', stripe: 'none' });
    const checkedSeller = user({ id: 'checked-seller', role: 'SELLER' });
    const listedOnly = user({ id: 'listed-only', role: 'SELLER' });
    assert.equal(matchesAudience(checkedSeller, stripeSelection), true);
    assert.equal(matchesAudience(listedOnly, stripeSelection), true);
    assert.deepEqual(inclusionReasons(checkedSeller, stripeSelection), ['Geen actuele Stripe-koppeling in HomeCheff']);
    const checked = checkedRecipients([checkedSeller, listedOnly], [checkedSeller.id]);
    assert.equal(checked.ok, true);
    if (checked.ok) assert.deepEqual(checked.recipients.map((item) => item.id), [checkedSeller.id]);
    assert.equal(checkedRecipients([checkedSeller, listedOnly], []).ok, false);
    const outside = checkedRecipients([checkedSeller, listedOnly], ['not-in-filter']);
    assert.equal(outside.ok, false);
    if (!outside.ok) assert.equal(outside.code, 'outside');

    const openCourier = user({ id: 'open-courier', role: 'DELIVERY', delivery: deliveryOpen });
    const agreementSelection = selection({ audience: 'delivery', agreementVersion: DELIVERY_AGREEMENT_VERSION });
    assert.deepEqual(inclusionReasons(openCourier, agreementSelection), ['Bezorgovereenkomst staat open']);
    const either = selection({
      audience: 'delivery',
      match: 'any',
      stripe: 'none',
      agreementVersion: DELIVERY_AGREEMENT_VERSION,
    });
    const stripeOnly = user({
      id: 'stripe-only',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date('2024-01-01T00:00:00.000Z'),
        agreementDocumentId: DELIVERY_AGREEMENT_VERSION,
      },
    });
    assert.deepEqual(inclusionReasons(stripeOnly, either), ['Geen actuele Stripe-koppeling in HomeCheff']);
    assert.equal(inclusionReasons(buyer, selection({ audience: 'buyers' }))[0], 'Doelgroep kopers');
  });

  it('keeps an empty payout field apart from a stored Connect trace', () => {
    const ready = user({
      id: 'current-ready',
      role: 'SELLER',
      sellerRoles: ['chef'],
      hasSellerProfile: true,
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_current',
      stripeConnectOnboardingCompleted: true,
      stripeLinkReview: true,
    });
    assert.equal(payoutConnectStatus(ready), 'ready');
    assert.equal(matchesAudience(ready, selection({ audience: 'sellers', stripe: 'none' })), false);
    assert.equal(matchesAudience(ready, selection({ audience: 'delivery', stripe: 'ready' })), true);

    const empty = user({ id: 'empty-link', role: 'SELLER', hasSellerProfile: true });
    assert.equal(stripeLinkNeedsReview({ stripeConnectAccountId: null }), false);
    assert.equal(payoutConnectStatus(empty), 'none');
    assert.equal(payoutConnectStatusLabel('none'), 'Geen actuele Stripe-koppeling in HomeCheff');
    assert.equal(matchesAudience(empty, selection({ audience: 'sellers', stripe: 'none' })), true);

    const migrated = user({ id: 'migrated-empty', role: 'DELIVERY', delivery: deliveryOpen, stripeLinkReview: true });
    assert.equal(auditMetaHasConnectAccount({ oldStripeAccountId: 'acct_old', newStripeAccountId: 'acct_new' }), true);
    assert.equal(auditMetaHasConnectAccount({ stripeIdentityPreserved: false, email: 'person@example.test' }), false);
    assert.equal(
      stripeLinkNeedsReview({
        stripeConnectAccountId: null,
        onboardingOrMigrationRecorded: true,
      }),
      true,
    );
    assert.equal(payoutConnectStatus(migrated), 'review');
    assert.equal(matchesAudience(migrated, selection({ audience: 'delivery', stripe: 'none' })), false);
    assert.equal(matchesAudience(migrated, selection({ audience: 'delivery', stripe: 'review' })), true);
    assert.equal(payoutConnectStatusLabel('review'), 'Stripe-koppeling controleren');

    const affiliateOnly = user({ id: 'affiliate-only', role: 'SELLER', hasSellerProfile: true });
    assert.equal(
      stripeLinkNeedsReview({
        stripeConnectAccountId: null,
        affiliateConnectAccountId: 'acct_affiliate',
      }),
      true,
    );
    assert.equal(
      stripeLinkNeedsReview({
        stripeConnectAccountId: 'acct_current',
        affiliateConnectAccountId: 'acct_affiliate',
      }),
      false,
    );
    assert.equal(payoutConnectStatus({ ...affiliateOnly, stripeLinkReview: true }), 'review');
    assert.notEqual(payoutConnectStatus({ ...affiliateOnly, stripeLinkReview: true }), 'incomplete');
    assert.equal(affiliateOnly.stripeConnectAccountId, null);

    const sellers = [ready, empty].filter((item) => matchesAudience(item, selection({ audience: 'sellers', stripe: 'none' })));
    assert.deepEqual(sellers.map((item) => item.id), ['empty-link']);
  });

  it('finds incomplete sellers and couriers once when no role is chosen', () => {
    const dual = user({
      id: 'dual',
      role: 'SELLER',
      sellerRoles: ['chef'],
      hasSellerProfile: true,
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_dual',
      stripeConnectOnboardingCompleted: false,
    });
    const seller = user({
      id: 'seller',
      role: 'SELLER',
      hasSellerProfile: true,
      stripeConnectAccountId: 'acct_seller',
      stripeConnectOnboardingCompleted: false,
    });
    const courier = user({
      id: 'courier',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_courier',
      stripeConnectOnboardingCompleted: false,
    });
    const buyer = user({ id: 'buyer-only', role: 'BUYER', buyerRoles: ['explorer'] });
    const readySeller = user({
      id: 'ready-seller',
      role: 'SELLER',
      hasSellerProfile: true,
      stripeConnectAccountId: 'acct_ready_seller',
      stripeConnectOnboardingCompleted: true,
    });
    const openSelection = selection({ audience: 'applicable', stripe: 'incomplete' });
    const matched = [dual, seller, courier, buyer, readySeller].filter((item) => matchesAudience(item, openSelection));
    assert.deepEqual(matched.map((item) => item.id), ['dual', 'seller', 'courier']);
    assert.equal(new Set(matched.map((item) => item.id)).size, matched.length);
    assert.deepEqual(
      [dual, seller, courier].filter((item) => matchesAudience(item, selection({ audience: 'delivery', stripe: 'incomplete' }))).map((item) => item.id),
      ['dual', 'courier'],
    );
    assert.equal(selectionCanList(selection({ audience: 'applicable' })), false);
    assert.equal(matchesAudience(seller, selection({ audience: 'applicable' })), false);
    assert.equal(selectionCanList(selection({ audience: 'all' })), true);
    const agreement = selection({ audience: 'applicable', agreementVersion: DELIVERY_AGREEMENT_VERSION });
    assert.equal(matchesAudience(courier, agreement), true);
    assert.equal(matchesAudience(seller, agreement), false);
    const checked = checkedRecipients(matched, ['seller']);
    assert.equal(checked.ok, true);
    if (checked.ok) assert.deepEqual(checked.recipients.map((item) => item.id), ['seller']);
  });
});

describe('Stripe nog niet gereed voor uitbetalingen', () => {
  const none = user({ id: 'stripe-none', role: 'DELIVERY', delivery: deliveryOpen });
  const incomplete = user({
    id: 'stripe-incomplete',
    role: 'SELLER',
    hasSellerProfile: true,
    delivery: deliveryOpen,
    stripeConnectAccountId: 'acct_open',
    stripeConnectOnboardingCompleted: false,
  });
  const review = user({ id: 'stripe-review', role: 'DELIVERY', delivery: deliveryOpen, stripeLinkReview: true });
  const ready = user({
    id: 'stripe-ready',
    role: 'DELIVERY',
    delivery: deliveryOpen,
    stripeConnectAccountId: 'acct_ready_combined',
    stripeConnectOnboardingCompleted: true,
  });
  const people = [none, incomplete, review, ready];
  const combined = selection({ audience: 'delivery', stripe: 'not_ready' });

  it('keeps the separate statuses and leaves ready payouts out of the combined list', () => {
    assert.equal(stripeStatusMatches('none', 'not_ready'), true);
    assert.equal(stripeStatusMatches('incomplete', 'not_ready'), true);
    assert.equal(stripeStatusMatches('review', 'not_ready'), true);
    assert.equal(stripeStatusMatches('ready', 'not_ready'), false);
    assert.equal(matchesAudience(none, selection({ audience: 'delivery', stripe: 'none' })), true);
    assert.equal(matchesAudience(review, selection({ audience: 'delivery', stripe: 'none' })), false);
    assert.equal(matchesAudience(incomplete, selection({ audience: 'delivery', stripe: 'incomplete' })), true);
    assert.equal(matchesAudience(ready, selection({ audience: 'delivery', stripe: 'ready' })), true);
    const matched = people.filter((item) => matchesAudience(item, combined));
    assert.deepEqual(matched.map((item) => item.id), ['stripe-none', 'stripe-incomplete', 'stripe-review']);
    assert.deepEqual(inclusionReasons(none, combined), ['Geen actuele Stripe-koppeling in HomeCheff']);
    assert.deepEqual(inclusionReasons(incomplete, combined), ['Connect onvolledig']);
    assert.deepEqual(inclusionReasons(review, combined), ['Stripe-koppeling controleren']);
    const counts = countStripeStatuses(matched);
    assert.deepEqual(counts, { none: 1, incomplete: 1, review: 1, ready: 0, unique: 3 });
    assert.equal(counts.none + counts.incomplete + counts.review + counts.ready, counts.unique);
    assert.match(stripeCountLines(counts, 'not_ready').join(' '), /Uniek totaal: 3/);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'not_ready' }).ok, true);
    const bulk = matched.filter((item) => !requiresExplicitStripeCheck(item)).map((item) => item.id);
    assert.deepEqual(bulk, ['stripe-none', 'stripe-incomplete']);
    assert.equal(explicitReviewBlock(matched, bulk), 'Een account met Stripe-koppeling controleren moet apart aangevinkt worden. Selecteer alle resultaten neemt die accounts niet mee. Er is niets verstuurd.');
    assert.equal(explicitReviewBlock([none, incomplete], bulk), null);
    assert.equal(explicitReviewBlock(matched, [...bulk, review.id]), null);
  });

  it('counts a person with two roles once and still applies the other filters', () => {
    const open = selection({ audience: 'applicable', stripe: 'not_ready' });
    const matched = people.filter((item) => matchesAudience(item, open));
    assert.deepEqual(matched.map((item) => item.id), ['stripe-none', 'stripe-incomplete', 'stripe-review']);
    assert.equal(new Set(matched.map((item) => item.id)).size, matched.length);
    const suspended = user({
      id: 'suspended-open',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      suspendedAt: new Date(),
      stripeConnectAccountId: 'acct_suspended',
      stripeConnectOnboardingCompleted: false,
    });
    const activeFilter = selection({ audience: 'delivery', stripe: 'not_ready', accountStatus: 'active' });
    assert.equal(matchesAudience(incomplete, activeFilter), true);
    assert.equal(matchesAudience(suspended, activeFilter), false);
    const accepted = user({
      id: 'ready-open-agreement',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: null,
        agreementDocumentId: null,
      },
      stripeConnectAccountId: 'acct_ready_agreement',
      stripeConnectOnboardingCompleted: true,
    });
    const narrowed = selection({
      audience: 'delivery',
      stripe: 'not_ready',
      agreementVersion: DELIVERY_AGREEMENT_VERSION,
    });
    assert.equal(matchesAudience(review, narrowed), true);
    assert.equal(matchesAudience(accepted, narrowed), false);
    const either = selection({
      audience: 'delivery',
      match: 'any',
      stripe: 'not_ready',
      agreementVersion: DELIVERY_AGREEMENT_VERSION,
    });
    assert.equal(matchesAudience(accepted, either), true);
    const eitherMatched = [review, accepted].filter((item) => matchesAudience(item, either));
    const eitherCounts = countStripeStatuses(eitherMatched);
    assert.equal(eitherCounts.unique, 2);
    assert.equal(eitherCounts.ready, 1);
    assert.match(stripeCountLines(eitherCounts, 'not_ready').join(' '), /ander filter/);
    const tokenBase = {
      selection: combined,
      message: 'stripe',
      subject: 'stripe',
      title: 'stripe',
      route: '/notifications',
      sendNotification: true,
      sendEmail: false,
      confirmRepeat: false,
      recipientIds: [none.id, review.id],
      explicitReviewUserIds: [review.id],
    };
    assert.notEqual(
      previewCanonicalPayload(tokenBase),
      previewCanonicalPayload({ ...tokenBase, explicitReviewUserIds: [] }),
    );
  });
});

describe('notification send keeps unchecked filter matches out of the message', () => {
  it('requires the checked set on the server and does not address the whole filter result', () => {
    const route = readFileSync(resolve(process.cwd(), 'app/api/admin/notifications/send/route.ts'), 'utf8');
    const ui = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    const loader = readFileSync(resolve(process.cwd(), 'lib/admin/load-notification-audience.ts'), 'utf8');
    assert.match(loader, /loadStripeLinkReviewIds/);
    assert.match(loader, /stripeLinkReview:/);
    assert.match(route, /shouldSendChannel\(relevantDecisions/);
    assert.match(route, /confirmRepeat/);
    assert.match(route, /checkedRecipients\(matched/);
    assert.match(route, /mergeBroadcastRecipients/);
    assert.match(route, /loadActiveAdminsByIds/);
    assert.match(route, /manualAdmins/);
    assert.match(route, /readLedgers\(campaignId, chosen\.map/);
    assert.match(route, /listOnly/);
    assert.match(route, /matchesAudience\(user, selection\)/);
    assert.match(route, /explicitReviewBlock\(checked\.recipients/);
    assert.match(route, /stripeCountLines\(countStripeStatuses\(matched\)/);
    assert.match(ui, /not_ready/);
    assert.match(ui, /requiresExplicitCheck/);
    assert.match(ui, /explicitReviewUserIds/);
    assert.doesNotMatch(route, /readLedgers\(campaignId, matched/);
    assert.match(ui, /Ontvangers bekijken/);
    assert.match(ui, /id="notification-recipients"/);
    assert.match(ui, /Selecteer alle resultaten/);
    assert.match(ui, /Wis selectie/);
    assert.match(ui, /includeUserIds: selectedIds/);
    assert.match(ui, /Beheerder toevoegen/);
    assert.match(ui, /manualAdmins:/);
    assert.match(ui, /listOnly: true/);
    assert.match(ui, /scrollIntoView/);
  });
});

describe('delivery activation is only an open step when the existing check says so', () => {
  it('reports missing stored delivery requirements and not an absent date when the gate would not', () => {
    const missing = getDeliveryProfileCompletionFromRow(
      {
        isActive: true,
        isOnline: false,
        homeLat: null,
        homeLng: null,
        maxDistance: null,
        nationalCoverage: false,
        pricingEnabled: false,
        baseFeeCents: null,
        pricePerKmCents: null,
        minimumFeeCents: null,
        freeDeliveryRadiusKm: null,
        providerType: 'INDEPENDENT',
        companyDisplayName: null,
        availableDays: [],
        availableTimeSlots: [],
      },
      { dateOfBirth: new Date('1990-01-01'), lat: null, lng: null, place: null, address: null },
    );
    assert.equal(missing.ok, false);
    if (missing.ok) return;
    assert.ok(missing.missing.includes('pricing'));
    assert.ok(missing.missing.includes('serviceArea'));
    assert.equal(missing.missing.includes('dateOfBirth'), false);
  });
});

describe('repeat and partial send', () => {
  it('does not address recipients who already received a channel', () => {
    const accepted = ledgerAfterEmail(null, 'accepted');
    assert.equal(planEmail(accepted), 'skip_done');
    assert.equal(emailLedgerStatus({ status: 'sent' }), 'accepted');
    assert.equal(emailLedgerStatus({ status: 'failed' }), 'failed');
    assert.equal(emailLedgerStatus({ status: 'suppressed', reason: 'local_idempotent_replay' }), 'unconfirmed');
    const failed = ledgerAfterEmail(null, 'failed');
    assert.equal(planEmail(failed), 'send');
    assert.equal(emailAttemptNumber(failed), 2);
    const unconfirmed = ledgerAfterEmail(null, 'unconfirmed');
    assert.equal(planEmail(unconfirmed), 'skip_unconfirmed');
    assert.equal(planInApp({ ...accepted, inApp: true }), 'skip_done');
    assert.equal(planPush(ledgerAfterPush(null, 'offered')), 'skip_done');
    assert.equal(planPush(ledgerAfterPush(null, 'failed')), 'send');
  });

  it('reports channels separately and does not call acceptance delivery', () => {
    const partial = formatBroadcastResult({
      notificationsCreated: 1,
      notificationsSkipped: 1,
      pushOffered: 1,
      pushFailed: 1,
      pushSkipped: 0,
      pushNoToken: 0,
      emailsAccepted: 1,
      emailsFailed: 1,
      emailsSuppressed: 0,
      emailsUnconfirmed: 1,
      emailsSkipped: 1,
      emailRequested: true,
      pushRequested: true,
      inAppRequested: true,
    });
    assert.equal(partial.outcome, 'partial');
    assert.match(partial.message, /Gedeeltelijk gelukt/);
    assert.match(partial.message, /geaccepteerd door de maildienst/);
    assert.match(partial.message, /aangeboden aan de pushdienst/);
    assert.match(partial.message, /niet opnieuw aangeschreven/);
    assert.doesNotMatch(partial.message, /afgeleverd/);
    assert.ok(partial.lines.every((line) => line.trim().length > 0));
  });

  it('keeps a second flight from starting and turns a blank body into text', () => {
    __resetBroadcastFlightForTests();
    assert.equal(claimBroadcastFlight('campaign-test'), true);
    assert.equal(claimBroadcastFlight('campaign-test'), false);
    releaseBroadcastFlight('campaign-test');
    assert.equal(claimBroadcastFlight('campaign-test'), true);
    releaseBroadcastFlight('campaign-test');
    const lines = visibleBulkFeedbackLines({ message: '   ', lines: ['', ' '] });
    assert.equal(lines.length, 1);
    assert.match(lines[0], /leesbare uitslag/);
  });
});
