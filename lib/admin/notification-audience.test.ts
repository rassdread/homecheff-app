import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { deriveConnectAccountStatusFromDb, isHomecheffPaymentReady } from '@/lib/stripe/connect-account-status';
import { DELIVERY_AGREEMENT_DOCUMENT_ID, deliveryAgreementAcceptanceData } from '@/lib/delivery/delivery-agreement';
import {
  DELIVERY_AGREEMENT_VERSION as AGREEMENT_SNAPSHOT_VERSION,
  agreementAcceptanceRow,
} from '@/lib/delivery/delivery-agreement-version';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';
import {
  DELIVERY_AGREEMENT_VERSION,
  agreementVersionLabel,
  describeSelection,
  emptySelection,
  selectionFilterChips,
  selectionPlainSummary,
  stripeAudienceFullyReady,
  stripePayoutExplicitlyRejected,
  stripeChoiceLabel,
  stripeRowLabel,
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
  stripeConnectionFullyUsable,
  stripeFilterMatches,
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
import { adminChannelLines } from '@/lib/admin/notification-admin-selection';
import { audienceWhere, staffAudienceWhere } from '@/lib/admin/load-notification-audience';
import { hasUsablePushRegistration, isUsableRegisteredPushToken } from '@/lib/pushTokenValidation';

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
    push: null,
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

  it('keeps the technical cache apart from full usability, including dual roles', () => {
    assert.equal(payoutConnectStatus(sellerCourier), 'incomplete');
    assert.equal(payoutConnectStatus(sellerNoAccount), 'none');
    assert.equal(payoutConnectStatus(sellerReady), 'ready');
    const notReady = selection({ audience: 'delivery', stripe: 'not_ready' });
    const sellersOpen = selection({ audience: 'sellers', stripe: 'not_ready' });
    assert.equal(stripeConnectionFullyUsable(sellerReady), false);
    assert.equal(matchesAudience(sellerCourier, notReady), true);
    assert.equal(matchesAudience(sellerNoAccount, notReady), true);
    assert.equal(matchesAudience(sellerReady, notReady), false);
    assert.equal(matchesAudience(courierOnlyNone, notReady), true);
    assert.equal(matchesAudience(sellerNoAccount, sellersOpen), true);
    assert.equal(matchesAudience(sellerCourier, sellersOpen), true);
    assert.equal(matchesAudience(sellerReady, sellersOpen), true);
    assert.equal(matchesAudience(sellerReady, selection({ audience: 'sellers', stripe: 'ready' })), false);
    assert.equal(stripeRowLabel(sellerReady), 'Uitbetalingscontrole niet opgeslagen');
    assert.equal(matchesAudience(courierOnlyNone, sellersOpen), false);
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
    const usableOpen = user({
      id: 'usable-open',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_usable_open',
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
    });
    const both = selection({
      audience: 'delivery',
      match: 'all',
      stripe: 'not_ready',
      agreementVersion: DELIVERY_AGREEMENT_VERSION,
    });
    assert.equal(matchesAudience(sellerCourier, both), true);
    assert.equal(matchesAudience(usableOpen, both), false);
    const either = { ...both, match: 'any' as const, stripe: 'ready' as const };
    assert.equal(matchesAudience(sellerCourier, either), true);
    assert.equal(matchesAudience(usableOpen, either), true);
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
      selection: selection({ audience: 'sellers' as const, stripe: 'not_ready' }),
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
    const stripeSelection = selection({ audience: 'sellers', stripe: 'not_ready' });
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
      stripe: 'not_ready',
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
    assert.equal(stripeConnectionFullyUsable(ready), false);
    assert.equal(stripeAudienceFullyReady(ready), false);
    assert.equal(stripeRowLabel(ready), 'Uitbetalingscontrole niet opgeslagen');
    assert.equal(matchesAudience(ready, selection({ audience: 'sellers', stripe: 'not_ready' })), true);
    assert.equal(matchesAudience(ready, selection({ audience: 'sellers', stripe: 'ready' })), false);
    assert.equal(matchesAudience(ready, selection({ audience: 'delivery', stripe: 'ready' })), false);
    assert.equal(matchesAudience(ready, selection({ audience: 'delivery', stripe: 'not_ready' })), true);

    const empty = user({ id: 'empty-link', role: 'SELLER', hasSellerProfile: true });
    assert.equal(stripeLinkNeedsReview({ stripeConnectAccountId: null }), false);
    assert.equal(payoutConnectStatus(empty), 'none');
    assert.equal(payoutConnectStatusLabel('none'), 'Geen actuele Stripe-koppeling in HomeCheff');
    assert.equal(matchesAudience(empty, selection({ audience: 'sellers', stripe: 'not_ready' })), true);
    assert.equal(matchesAudience(empty, selection({ audience: 'sellers', stripe: 'ready' })), false);

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
    assert.equal(matchesAudience(migrated, selection({ audience: 'delivery', stripe: 'not_ready' })), true);
    assert.equal(matchesAudience(migrated, selection({ audience: 'delivery', stripe: 'ready' })), false);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'review' }).ok, false);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'none' }).ok, false);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'incomplete' }).ok, false);
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

    const sellers = [ready, empty].filter((item) => matchesAudience(item, selection({ audience: 'sellers', stripe: 'not_ready' })));
    assert.deepEqual(sellers.map((item) => item.id), ['current-ready', 'empty-link']);
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
    const usable = user({
      id: 'usable-courier',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_usable',
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
    });
    const openSelection = selection({ audience: 'applicable', stripe: 'not_ready' });
    const matched = [dual, seller, courier, buyer, readySeller, usable].filter((item) => matchesAudience(item, openSelection));
    assert.deepEqual(matched.map((item) => item.id), ['dual', 'seller', 'courier', 'ready-seller']);
    assert.equal(matchesAudience(readySeller, selection({ audience: 'applicable', stripe: 'ready' })), false);
    assert.equal(new Set(matched.map((item) => item.id)).size, matched.length);
    assert.equal(matchesAudience(usable, selection({ audience: 'applicable', stripe: 'ready' })), true);
    assert.deepEqual(
      [dual, seller, courier, usable].filter((item) => matchesAudience(item, selection({ audience: 'delivery', stripe: 'not_ready' }))).map((item) => item.id),
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

  it('splits fully usable accounts from every other Stripe status', () => {
    const usable = user({
      id: 'stripe-usable',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_usable',
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
      stripeConnectOnboardingCompleted: false,
    });
    const business = user({
      id: 'stripe-business',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_business',
      stripeConnectTrack: 'BUSINESS',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
      stripeConnectOnboardingCompleted: true,
    });
    const everyone = [...people, usable, business];
    assert.equal(stripeConnectionFullyUsable(usable), true);
    assert.equal(stripeConnectionFullyUsable(ready), false);
    assert.equal(stripeConnectionFullyUsable(business), false);
    assert.equal(stripeFilterMatches(none, 'not_ready'), true);
    assert.equal(stripeFilterMatches(usable, 'ready'), true);
    assert.equal(stripeFilterMatches(usable, 'not_ready'), false);
    const readySelection = selection({ audience: 'delivery', stripe: 'ready' });
    const readyMatched = everyone.filter((item) => matchesAudience(item, readySelection));
    const matched = everyone.filter((item) => matchesAudience(item, combined));
    assert.deepEqual(readyMatched.map((item) => item.id), ['stripe-usable']);
    assert.deepEqual(matched.map((item) => item.id), ['stripe-none', 'stripe-incomplete', 'stripe-review', 'stripe-ready', 'stripe-business']);
    assert.equal(readyMatched.length + matched.length, everyone.length);
    assert.equal(stripeRowLabel(usable), 'Stripe volledig gereed');
    assert.equal(stripeRowLabel(ready), 'Uitbetalingscontrole niet opgeslagen');
    assert.equal(stripeRowLabel(business), 'Uitbetalingscontrole niet opgeslagen');
    assert.deepEqual(inclusionReasons(none, combined), ['Geen actuele Stripe-koppeling in HomeCheff']);
    assert.deepEqual(inclusionReasons(incomplete, combined), ['Connect onvolledig']);
    assert.deepEqual(inclusionReasons(review, combined), ['Stripe-koppeling controleren']);
    assert.deepEqual(inclusionReasons(ready, combined), ['Uitbetalingscontrole niet opgeslagen']);
    assert.deepEqual(inclusionReasons(usable, readySelection), ['Stripe volledig gereed']);
    const counts = countStripeStatuses(matched);
    assert.deepEqual(counts, { none: 1, incomplete: 1, review: 1, ready: 2, unique: 5 });
    assert.match(stripeCountLines(counts, 'not_ready').join(' '), /Uniek totaal: 5/);
    assert.match(stripeCountLines(counts, 'not_ready').join(' '), /Stripe-koppeling controleren: 1/);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'not_ready' }).ok, true);
    assert.equal(parseAudienceSelection({ audience: 'delivery', stripe: 'none' }).ok, false);
    const selected = matched.map((item) => item.id);
    assert.equal(explicitReviewBlock(matched, selected), null);
    assert.equal(explicitReviewBlock(matched, selected.filter((id) => id !== review.id)), 'Een account met Stripe-koppeling controleren staat in de selectie, maar de bevestiging ontbreekt. Vernieuw het voorbeeld. Er is niets verstuurd.');
    const payoutReadyCourier = user({
      id: 'payout-ready-courier',
      name: 'Sergio Arrias',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_payout_ready',
      stripeConnectOnboardingCompleted: true,
    });
    const noStripe = user({ id: 'courier-no-stripe', role: 'DELIVERY', delivery: deliveryOpen });
    const connectIncomplete = user({
      id: 'courier-incomplete',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_incomplete_only',
      stripeConnectOnboardingCompleted: false,
    });
    const deliveryNotReady = selection({ audience: 'delivery', match: 'all', stripe: 'not_ready' });
    assert.equal(deriveConnectAccountStatusFromDb({
      stripeConnectAccountId: payoutReadyCourier.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: payoutReadyCourier.stripeConnectOnboardingCompleted,
    }).paymentReady, true);
    assert.equal(stripeConnectionFullyUsable(payoutReadyCourier), false);
    assert.equal(stripeAudienceFullyReady(payoutReadyCourier), false);
    assert.equal(stripePayoutExplicitlyRejected(payoutReadyCourier), false);
    assert.equal(stripeRowLabel(payoutReadyCourier), 'Uitbetalingscontrole niet opgeslagen');
    assert.equal(matchesAudience(payoutReadyCourier, deliveryNotReady), true);
    assert.equal(matchesAudience(payoutReadyCourier, selection({ audience: 'delivery', match: 'all', stripe: 'ready' })), false);
    const rejectedPayout = user({
      id: 'payout-rejected',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_rejected',
      stripeConnectOnboardingCompleted: true,
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: false,
      stripeTransfersStatus: 'inactive',
    });
    const centralReady = user({
      id: 'central-ready',
      role: 'DELIVERY',
      delivery: deliveryOpen,
      stripeConnectAccountId: 'acct_central',
      stripeConnectOnboardingCompleted: false,
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
    });
    assert.equal(isHomecheffPaymentReady({
      chargesEnabled: null,
      payoutsEnabled: false,
      transfersCapability: 'inactive',
      connectTrack: 'PARTICULAR',
    }), false);
    assert.equal(stripePayoutExplicitlyRejected(rejectedPayout), true);
    assert.equal(stripeRowLabel(rejectedPayout), 'Opgeslagen uitbetaling is niet gereed');
    assert.equal(matchesAudience(rejectedPayout, deliveryNotReady), true);
    assert.equal(stripeConnectionFullyUsable(centralReady), true);
    assert.equal(stripeRowLabel(centralReady), 'Stripe volledig gereed');
    assert.equal(matchesAudience(centralReady, deliveryNotReady), false);
    assert.equal(matchesAudience(noStripe, deliveryNotReady), true);
    assert.equal(stripeRowLabel(noStripe), 'Geen actuele Stripe-koppeling in HomeCheff');
    assert.equal(matchesAudience(connectIncomplete, deliveryNotReady), true);
    assert.equal(stripeRowLabel(connectIncomplete), 'Connect onvolledig');
    assert.equal(matchesAudience(user({
      id: 'buyer-with-ready-cache',
      role: 'BUYER',
      buyerRoles: ['explorer'],
      stripeConnectAccountId: 'acct_buyer_ready',
      stripeConnectOnboardingCompleted: true,
    }), deliveryNotReady), false);
    const listed = [noStripe, connectIncomplete, payoutReadyCourier, centralReady].filter((item) => matchesAudience(item, deliveryNotReady));
    assert.deepEqual(listed.map((item) => item.id), ['courier-no-stripe', 'courier-incomplete', 'payout-ready-courier']);
    const rejected = checkedRecipients(listed, ['central-ready', 'courier-no-stripe']);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.code, 'outside');
    const acceptedIds = checkedRecipients(listed, listed.map((item) => item.id));
    assert.equal(acceptedIds.ok, true);
    if (acceptedIds.ok) assert.deepEqual(acceptedIds.recipients.map((item) => item.id), listed.map((item) => item.id));
    assert.equal(requiresExplicitStripeCheck(review), true);
    assert.equal(requiresExplicitStripeCheck(usable), false);
  });

  it('counts a person with two roles once and still applies the other filters', () => {
    const open = selection({ audience: 'applicable', stripe: 'not_ready' });
    const matched = people.filter((item) => matchesAudience(item, open));
    assert.deepEqual(matched.map((item) => item.id), ['stripe-none', 'stripe-incomplete', 'stripe-review', 'stripe-ready']);
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
      stripeConnectTrack: 'PARTICULAR',
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
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
    assert.equal(matchesAudience(accepted, selection({ audience: 'delivery', stripe: 'not_ready' })), false);
    assert.equal(matchesAudience(accepted, either), true);
    const eitherMatched = [review, accepted].filter((item) => matchesAudience(item, either));
    const eitherCounts = countStripeStatuses(eitherMatched);
    assert.equal(eitherCounts.unique, 2);
    assert.equal(eitherCounts.ready, 1);
    assert.match(stripeCountLines(eitherCounts, 'not_ready', 'nl', 'any').join(' '), /OF kan iemand meenemen/);
    assert.match(selectionPlainSummary(either), /OF verruimt deze lijst/);
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
    assert.match(ui, /copy\('viewRecipients'\)/);
    assert.match(ui, /id="notification-recipients"/);
    assert.match(ui, /copy\('selectAll'\)/);
    assert.match(ui, /copy\('clearSelection'\)/);
    assert.match(ui, /includeUserIds: selectedIds/);
    assert.match(ui, /copy\('addAdmin'\)/);
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

describe('signup agreement id matches the notification filter', () => {
  it('recognizes the id both signup forms store and keeps older or missing versions on the existing rules', () => {
    const stored = deliveryAgreementAcceptanceData(new Date('2026-01-15T00:00:00.000Z'));
    assert.equal(stored.deliveryAgreementDocumentId, DELIVERY_AGREEMENT_DOCUMENT_ID);
    assert.equal(DELIVERY_AGREEMENT_VERSION, stored.deliveryAgreementDocumentId);
    const service = readFileSync(resolve(process.cwd(), 'lib/delivery/delivery-signup-service.ts'), 'utf8');
    const privateSignup = readFileSync(resolve(process.cwd(), 'app/delivery/signup/page.tsx'), 'utf8');
    const companySignup = readFileSync(resolve(process.cwd(), 'app/delivery/company/signup/page.tsx'), 'utf8');
    assert.match(service, /\.\.\.deliveryAgreementAcceptanceData\(\)/);
    assert.match(privateSignup, /\/api\/delivery\/signup/);
    assert.match(companySignup, /\/api\/delivery\/signup/);
    const current = user({
      id: 'current-acceptance',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date('2026-01-15T00:00:00.000Z'),
        agreementDocumentId: stored.deliveryAgreementDocumentId,
      },
    });
    const openFilter = selection({ audience: 'delivery', agreementVersion: DELIVERY_AGREEMENT_VERSION });
    assert.equal(agreementState(current), 'accepted');
    assert.equal(matchesAudience(current, openFilter), false);
    const older = user({
      id: 'older-acceptance',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date('2024-01-01T00:00:00.000Z'),
        agreementDocumentId: 'old-version',
      },
    });
    assert.equal(agreementState(older), 'open');
    assert.equal(matchesAudience(older, openFilter), true);
    const missing = user({
      id: 'missing-version',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date('2024-01-01T00:00:00.000Z'),
        agreementDocumentId: null,
      },
    });
    assert.equal(agreementState(missing), 'unknown_version');
    assert.equal(matchesAudience(missing, openFilter), false);
    const history = agreementAcceptanceRow({
      deliveryProfileId: 'profile-1',
      userId: 'current-acceptance',
      language: 'nl',
      acceptedAt: new Date('2026-01-15T00:00:00.000Z'),
    });
    assert.equal(history.documentId, stored.deliveryAgreementDocumentId);
    assert.equal(history.version, AGREEMENT_SNAPSHOT_VERSION);
    assert.notEqual(history.version, stored.deliveryAgreementDocumentId);
  });
});

describe('agreement display keeps the stored acceptance id', () => {
  it('shows a name and still treats the stored i18n id as accepted', () => {
    assert.equal(DELIVERY_AGREEMENT_VERSION, 'i18n:deliverySignup.legalModalTitle');
    assert.equal(agreementVersionLabel(DELIVERY_AGREEMENT_VERSION), 'Huidige bezorgovereenkomst');
    const accepted = user({
      id: 'accepted-current',
      role: 'DELIVERY',
      delivery: {
        ...deliveryOpen,
        agreementAcceptedAt: new Date('2024-02-02T00:00:00.000Z'),
        agreementDocumentId: 'i18n:deliverySignup.legalModalTitle',
      },
    });
    const open = selection({ audience: 'delivery', agreementVersion: DELIVERY_AGREEMENT_VERSION });
    assert.equal(agreementState(accepted), 'accepted');
    assert.equal(matchesAudience(accepted, open), false);
    const described = describeSelection(open).join(' ');
    assert.match(described, /Huidige bezorgovereenkomst/);
    assert.equal(described.includes('i18n:'), false);
    assert.equal(stripeChoiceLabel('none'), 'Stripe niet gekoppeld');
    assert.equal(stripeChoiceLabel('incomplete'), 'Stripe nog niet afgerond');
    assert.equal(stripeChoiceLabel('ready'), 'Stripe volledig gereed');
    assert.equal(stripeChoiceLabel('not_ready'), 'Stripe niet volledig gereed');
    const summary = selectionPlainSummary(emptySelection('applicable'));
    assert.match(summary, /selecteert niemand/);
    assert.match(summary, /niet automatisch/);
    assert.deepEqual(selectionFilterChips(selection({ audience: 'delivery', stripe: 'not_ready', match: 'all' })).map((chip) => chip.label), ['Stripe niet volledig gereed']);
    assert.match(selectionPlainSummary(selection({ audience: 'all' })), /bewust gekozen/);
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

const appToken = 'a'.repeat(40);
const webToken = 'w'.repeat(40);

describe('push registration filter', () => {
  it('counts one usable app or web registration and ignores revoked or invalid rows', () => {
    assert.equal(isUsableRegisteredPushToken({ token: appToken, isActive: true, type: 'FCM', platform: 'android' }), true);
    assert.equal(isUsableRegisteredPushToken({ token: webToken, isActive: true, type: 'FCM', platform: 'web' }), true);
    assert.equal(hasUsablePushRegistration([
      { token: appToken, isActive: true, type: 'FCM', platform: 'android' },
      { token: webToken, isActive: true, type: 'FCM', platform: 'web' },
    ]), true);
    assert.equal(hasUsablePushRegistration([]), false);
    assert.equal(isUsableRegisteredPushToken({ token: appToken, isActive: false, type: 'FCM', platform: 'android' }), false);
    assert.equal(isUsableRegisteredPushToken({ token: 'short', isActive: true, type: 'FCM', platform: 'ios' }), false);
    assert.equal(isUsableRegisteredPushToken({ token: appToken, isActive: true, type: 'WEB_PUSH', platform: 'web' }), false);
    assert.equal(isUsableRegisteredPushToken({ token: appToken, isActive: true, type: 'FCM', platform: 'desktop' }), false);
    assert.equal(isUsableRegisteredPushToken({ token: appToken, isActive: true, type: 'FCM', platform: '' }), true);
  });

  it('uses the same person for the list, the count and both match modes', () => {
    const withApp = user({ id: 'app', pushReachable: true, role: 'BUYER', buyerRoles: ['explorer'] });
    const withWeb = user({ id: 'web', pushReachable: true, role: 'BUYER', buyerRoles: ['explorer'] });
    const withBoth = user({ id: 'both', pushReachable: true, role: 'BUYER', buyerRoles: ['explorer'] });
    const without = user({ id: 'none', pushReachable: false, role: 'BUYER', buyerRoles: ['explorer'] });
    const people = [withApp, withWeb, withBoth, without];
    const registered = selection({ audience: 'buyers', push: 'registered' });
    const unregistered = selection({ audience: 'buyers', push: 'unregistered' });
    assert.deepEqual(people.filter((person) => matchesAudience(person, registered)).map((person) => person.id), ['app', 'web', 'both']);
    assert.deepEqual(people.filter((person) => matchesAudience(person, unregistered)).map((person) => person.id), ['none']);
    assert.equal(people.filter((person) => matchesAudience(person, registered)).length, 3);
    assert.equal(matchesAudience(user({ id: 'staff', role: 'ADMIN', pushReachable: true }), selection({ audience: 'all', push: 'registered' })), false);
  });

  it('combines with Stripe and keeps email and the inbox available', () => {
    const notReady = user({
      id: 'seller-open',
      role: 'SELLER',
      hasSellerProfile: true,
      sellerRoles: ['chef'],
      pushReachable: false,
      email: 'seller-open@homecheff-validation.test',
    });
    const readyWithPush = user({
      id: 'seller-ready-push',
      role: 'SELLER',
      hasSellerProfile: true,
      sellerRoles: ['chef'],
      stripeConnectAccountId: 'acct_ready',
      stripeConnectOnboardingCompleted: true,
      stripePayoutsEnabled: true,
      stripeTransfersStatus: 'active',
      stripeConnectTrack: 'PARTICULAR',
      pushReachable: true,
    });
    const buyerWithPush = user({ id: 'buyer-push', role: 'BUYER', buyerRoles: ['explorer'], pushReachable: true });
    const andFilter = selection({ audience: 'applicable', match: 'all', stripe: 'not_ready', push: 'unregistered' });
    const orFilter = selection({ audience: 'applicable', match: 'any', stripe: 'not_ready', push: 'registered' });
    assert.equal(matchesAudience(notReady, andFilter), true);
    assert.equal(matchesAudience(readyWithPush, andFilter), false);
    assert.equal(matchesAudience(buyerWithPush, andFilter), false);
    assert.equal(matchesAudience(notReady, orFilter), true);
    assert.equal(matchesAudience(readyWithPush, orFilter), true);
    assert.equal(matchesAudience(buyerWithPush, orFilter), true);
    assert.equal(selectionCanList(selection({ audience: 'applicable', push: 'registered' })), true);
    const emailLines = adminChannelLines({
      plan: { email: true, push: true, inApp: true },
      pushReachable: false,
      hasEmail: true,
    });
    assert.equal(emailLines.some((line) => line.startsWith('E-mail:')), true);
    assert.equal(emailLines.some((line) => line.startsWith('In-appmelding:')), true);
    assert.equal(stripeFilterMatches(readyWithPush, 'ready'), true);
  });

  it('changes the preview token and loads buyers without pulling in staff', () => {
    const base = previewCanonicalPayload({
      selection: selection({ audience: 'buyers' }),
      message: 'Bericht',
      subject: 'Onderwerp',
      title: 'Onderwerp',
      route: '/notifications',
      sendNotification: true,
      sendEmail: true,
      confirmRepeat: false,
      recipientIds: ['buyer'],
    });
    const changed = previewCanonicalPayload({
      selection: selection({ audience: 'buyers', push: 'registered' }),
      message: 'Bericht',
      subject: 'Onderwerp',
      title: 'Onderwerp',
      route: '/notifications',
      sendNotification: true,
      sendEmail: true,
      confirmRepeat: false,
      recipientIds: ['buyer'],
    });
    assert.notEqual(base, changed);
    const parsed = parseAudienceSelection({ audience: 'buyers', push: 'registered' });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.selection.push, 'registered');
      assert.equal(selectionFilterChips(parsed.selection)[0]?.id, 'push');
    }
    assert.equal(parseAudienceSelection({ audience: 'buyers', push: 'installed' }).ok, false);
    const where = JSON.stringify(audienceWhere('applicable', selection({ audience: 'applicable', push: 'registered' })));
    assert.equal(where.includes('"in":[]'), false);
    assert.equal(staffAudienceWhere('applicable', selection({ audience: 'applicable', push: 'unregistered' })), null);
    const summary = describeSelection(selection({ audience: 'buyers', push: 'unregistered' })).join(' ');
    assert.match(summary, /Zonder pushregistratie/);
    assert.match(summary, /E-mail/);
    const center = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    const sender = readFileSync(resolve(process.cwd(), 'lib/admin/admin-broadcast-fcm.ts'), 'utf8');
    assert.match(center, /push: pushFilter \|\| null/);
    assert.match(center, /id === 'push'/);
    assert.match(sender, /isUsableRegisteredPushToken/);
  });
});
