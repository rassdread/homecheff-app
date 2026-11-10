import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  audienceRoleLabels,
  matchesAudience,
  previewCanonicalPayload,
  type AudienceCandidate,
  type AudienceSelection,
} from '@/lib/admin/notification-audience';
import { audienceWhere, staffAudienceWhere } from '@/lib/admin/load-notification-audience';
import {
  activeStaffRejection,
  adminChannelLines,
  mergeBroadcastRecipients,
  narrowManualAdmins,
  parseManualAdmins,
  relevantContentDecisions,
} from '@/lib/admin/notification-admin-selection';
import {
  PUSH_CREATES_IN_APP_NOTE,
  channelsFromLedgerMeta,
  describeChannelOutcomes,
  pushAlsoCreatesInApp,
} from '@/lib/admin/broadcast-history';
import {
  ledgerAfterEmail,
  ledgerAfterInApp,
  ledgerAfterPush,
  ledgerMeta,
  planEmail,
  planInApp,
  planPush,
} from '@/lib/admin/broadcast-delivery-plan';

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

const sendBoth = { sendEmail: true, sendNotification: true };

describe('admins inside the selected audience', () => {
  const courierAdmin = user({
    id: 'super-courier',
    role: 'SUPERADMIN',
    delivery: deliveryOpen,
    stripeConnectAccountId: 'acct_super',
    stripeConnectOnboardingCompleted: false,
    pushReachable: true,
  });

  it('shows a superadmin with a matching delivery profile and keeps all-users and test accounts unchanged', () => {
    assert.equal(matchesAudience(courierAdmin, selection({ audience: 'delivery', stripe: 'incomplete' })), true);
    assert.deepEqual(audienceRoleLabels(courierAdmin), ['Superadmin', 'Bezorger']);
    assert.equal(matchesAudience(user({ id: 'plain-admin', role: 'ADMIN' }), selection({ audience: 'delivery' })), false);
    assert.equal(matchesAudience(courierAdmin, selection({ audience: 'all' })), false);
    assert.equal(
      matchesAudience(user({ id: 'buyer-admin', role: 'ADMIN', buyerRoles: ['explorer'] }), selection({ audience: 'buyers' })),
      true,
    );
    assert.equal(
      matchesAudience(courierAdmin, selection({ audience: 'applicable', verification: { kind: 'email', status: 'verified' } })),
      false,
    );
    assert.equal(matchesAudience(courierAdmin, selection({ audience: 'applicable', stripe: 'incomplete' })), true);
    assert.equal(
      matchesAudience(
        user({ id: 'reserved-admin', role: 'SUPERADMIN', email: 'ops@homecheff.invalid', delivery: deliveryOpen }),
        selection({ audience: 'delivery' }),
      ),
      false,
    );
    assert.equal(
      matchesAudience(
        user({ id: 'reserved-seller', role: 'SELLER', email: 'seller@homecheff.internal', hasSellerProfile: true }),
        selection({ audience: 'sellers' }),
      ),
      false,
    );
    const allWhere = JSON.stringify(audienceWhere('all'));
    assert.match(allWhere, /ADMIN/);
    assert.match(allWhere, /\.invalid/);
    assert.equal(staffAudienceWhere('all'), null);
    assert.match(JSON.stringify(staffAudienceWhere('delivery')), /DeliveryProfile/);
  });
});

describe('an admin outside the audience', () => {
  it('starts from the chosen send method and can be email, push, or both', () => {
    const outside = parseManualAdmins([
      { userId: 'admin-out', channels: ['email'] },
      { userId: 'admin-push', channels: ['push'] },
      { userId: 'admin-both', channels: ['email', 'push'] },
    ]);
    assert.equal(outside.ok, true);
    if (!outside.ok) return;
    const plans = mergeBroadcastRecipients({ audienceUserIds: [], manual: outside.admins, ...sendBoth });
    assert.deepEqual(plans.map((plan) => plan.userId), ['admin-out', 'admin-push', 'admin-both']);
    assert.deepEqual(plans[0], { userId: 'admin-out', email: true, push: false, inApp: false, source: 'manual' });
    assert.deepEqual(plans[1], { userId: 'admin-push', email: false, push: true, inApp: true, source: 'manual' });
    assert.equal(plans[2]?.email, true);
    assert.equal(plans[2]?.push, true);
    assert.equal(plans[2]?.inApp, true);
    const emailOnly = narrowManualAdmins(outside.admins, { sendEmail: true, sendNotification: false });
    assert.deepEqual(emailOnly.map((admin) => admin.userId), ['admin-out', 'admin-both']);
    assert.deepEqual(narrowManualAdmins(outside.admins, { sendEmail: false, sendNotification: false }), []);
  });

  it('rejects anyone who is not an active admin and keeps test accounts out', () => {
    assert.equal(activeStaffRejection({ role: 'SELLER', email: 'seller@homecheff-validation.test', accountDeletedAt: null, suspendedAt: null }), 'Een handmatig toegevoegde ontvanger is geen actief beheerdersaccount.');
    assert.equal(activeStaffRejection({ role: 'ADMIN', email: 'admin@homecheff-validation.test', accountDeletedAt: null, suspendedAt: new Date() }), 'Een handmatig toegevoegde ontvanger is geen actief beheerdersaccount.');
    assert.equal(activeStaffRejection({ role: 'SUPERADMIN', email: 'ops@homecheff.invalid', accountDeletedAt: null, suspendedAt: null }), 'Test- en systeemaccounts blijven uitgesloten.');
    assert.equal(activeStaffRejection({ role: 'ADMIN', email: 'admin@homecheff-validation.test', accountDeletedAt: null, suspendedAt: null }), null);
  });
});

describe('the same admin selected both ways', () => {
  it('merges channels and counts the person once per channel', () => {
    const parsed = parseManualAdmins([
      { userId: 'admin-both', channels: ['email'] },
      { userId: 'admin-both', channels: ['push'] },
    ]);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const plans = mergeBroadcastRecipients({
      audienceUserIds: ['admin-both', 'admin-both', 'seller-1'],
      manual: parsed.admins,
      ...sendBoth,
    });
    assert.equal(plans.length, 2);
    assert.deepEqual(plans[0], { userId: 'admin-both', email: true, push: true, inApp: true, source: 'both' });
    assert.equal(plans.filter((plan) => plan.userId === 'admin-both' && plan.email).length, 1);
    assert.equal(plans.filter((plan) => plan.userId === 'admin-both' && plan.push).length, 1);
    assert.equal(plans.filter((plan) => plan.userId === 'admin-both' && plan.inApp).length, 1);
    const accepted = ledgerAfterEmail(null, 'accepted');
    const offered = ledgerAfterPush(accepted, 'offered');
    const created = ledgerAfterInApp(offered);
    assert.equal(planEmail(created), 'skip_done');
    assert.equal(planPush(created), 'skip_done');
    assert.equal(planInApp(created), 'skip_done');
    const stored = ledgerMeta({ ...created, channels: { email: true, push: true, inApp: true } });
    assert.equal(channelsFromLedgerMeta(stored)?.includes('email'), true);
    const decisions = relevantContentDecisions(
      [
        { userId: 'admin-both', channel: 'push' as const },
        { userId: 'email-only', channel: 'push' as const },
        { userId: 'email-only', channel: 'email' as const },
      ],
      [
        plans[0]!,
        { userId: 'email-only', email: true, push: false, inApp: false, source: 'manual' },
      ],
    );
    assert.deepEqual(decisions.map((decision) => `${decision.userId}:${decision.channel}`), ['admin-both:push', 'email-only:email']);
  });

  it('shows push, missing devices and the in-app notice in the preview and history', () => {
    const withoutDevice = adminChannelLines({
      plan: { email: true, push: true, inApp: true },
      pushReachable: false,
      hasEmail: true,
    });
    assert.ok(withoutDevice.some((line) => line.includes('geen geldig pushapparaat geregistreerd')));
    assert.ok(withoutDevice.some((line) => line.includes('In-appmelding: wordt aangemaakt samen met push.')));
    assert.ok(withoutDevice.some((line) => line.includes('zelfde onderwerp, tekst en HomeCheff-opmaak')));
    const withDevice = adminChannelLines({
      plan: { email: false, push: true, inApp: true },
      pushReachable: true,
      hasEmail: true,
    });
    assert.equal(withDevice.some((line) => line.includes('geen geldig pushapparaat')), false);
    assert.ok(withDevice.some((line) => line.includes('zelfde titel, tekst en interne bestemming')));
    const channels = channelsFromLedgerMeta({ channels: { email: true, push: true, inApp: true } });
    assert.ok(channels);
    assert.equal(pushAlsoCreatesInApp(channels || []), true);
    assert.equal(PUSH_CREATES_IN_APP_NOTE, 'Push maakt ook een in-appmelding aan.');
    const outcomes = describeChannelOutcomes(channels || [], {
      email: 'accepted',
      push: 'no_token',
      inApp: 'created',
    });
    assert.deepEqual(outcomes.map((item) => item.status), [
      'In-appmelding aangemaakt',
      'Geen geldig pushapparaat geregistreerd',
      'E-mail geaccepteerd door maildienst',
    ]);
    assert.equal(outcomes[1]?.received, false);
    const emailOnly = channelsFromLedgerMeta({ channels: { email: true, push: false, inApp: false } });
    assert.deepEqual(emailOnly, ['email']);
  });

  it('changes the preview token when the manual channel changes and keeps one send path', () => {
    const base = {
      selection: selection({ audience: 'delivery' }),
      message: 'controle',
      subject: 'controle',
      title: 'controle',
      route: '/notifications',
      sendNotification: true,
      sendEmail: true,
      confirmRepeat: false,
      recipientIds: ['admin-both'],
      manualAdmins: [{ userId: 'admin-both', channels: ['email'] }],
    };
    assert.notEqual(previewCanonicalPayload(base), previewCanonicalPayload({
      ...base,
      manualAdmins: [{ userId: 'admin-both', channels: ['email', 'push'] }],
    }));
    const route = readFileSync(resolve(process.cwd(), 'app/api/admin/notifications/send/route.ts'), 'utf8');
    const ui = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    assert.equal(route.split('renderAdminBulkMessage(').length - 1, 1);
    assert.equal(route.split('sendAdminBroadcastFcmByUser(').length - 1, 1);
    assert.match(route, /stampChannels/);
    assert.match(ui, /Beheerder toevoegen/);
    assert.match(ui, /addedAdmins/);
  });
});
