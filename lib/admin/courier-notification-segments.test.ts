import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  agreementContentHash,
  DELIVERY_AGREEMENT_VERSION,
} from '@/lib/delivery/delivery-agreement-version';
import {
  assessCourierForNotification,
  parseCourierNotificationQuery,
  selectCourierRecipients,
  type CourierNotificationSource,
} from '@/lib/admin/courier-notification-segments';
import { COURIER_EMAIL_TEMPLATES } from '@/lib/admin/courier-notification-templates';
import {
  intersectCourierSnapshot,
  readCourierRecipientSnapshot,
  signCourierRecipientSnapshot,
} from '@/lib/admin/courier-recipient-snapshot';

const adultDob = new Date(Date.UTC(1990, 5, 15, 12, 0, 0));
const now = new Date('2026-10-28T12:00:00Z');
const secret = 'test-snapshot-secret';

function source(over: Partial<CourierNotificationSource> = {}): CourierNotificationSource {
  return {
    userId: 'courier-1',
    name: 'Tes',
    email: 'tes@example.com',
    deleted: false,
    suspended: false,
    blocked: false,
    isActive: true,
    isVerified: true,
    dateOfBirth: adultDob,
    marketingAccepted: false,
    onboardingCompleted: true,
    connectAccountId: 'acct_test',
    city: 'Vlaardingen',
    regions: [],
    nationalCoverage: false,
    transportation: ['BIKE'],
    lastActivity: new Date('2026-10-20T12:00:00Z'),
    agreementRows: [
      {
        version: DELIVERY_AGREEMENT_VERSION,
        contentHash: agreementContentHash('nl'),
        language: 'nl',
      },
    ],
    userLat: null,
    userLng: null,
    profile: {
      isActive: true,
      isOnline: false,
      homeLat: 51.91,
      homeLng: 4.34,
      maxDistance: 10,
      nationalCoverage: false,
      availableDays: ['maandag'],
      availableTimeSlots: ['evening'],
      workStartTime: null,
      workEndTime: null,
      pricingEnabled: true,
      baseFeeCents: 350,
      pricePerKmCents: 80,
      minimumFeeCents: 495,
      freeDeliveryRadiusKm: 0,
      providerType: 'INDEPENDENT',
      companyDisplayName: null,
      isVerified: true,
    },
    stripe: {
      source: 'live',
      failed: false,
      transfersStatus: 'active',
      account: {
        id: 'acct_test',
        business_type: 'individual',
        payouts_enabled: false,
        individual: { verification: { status: 'verified' } },
      },
    },
    ...over,
  };
}

function selected(rows: CourierNotificationSource[], segment: string, extra: Record<string, unknown> = {}) {
  const parsed = parseCourierNotificationQuery({ segment, ...extra });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) throw new Error('query');
  const assessed = rows.map((row) => assessCourierForNotification(row, now));
  return selectCourierRecipients(assessed, parsed.query, now);
}

test('a ready courier is included only when every eligibility condition holds', () => {
  const ready = selected([source()], 'READY_COURIERS');
  assert.deepEqual(ready.eligible.map((row) => row.userId), ['courier-1']);
  const payoutsOnly = source({
    stripe: {
      source: 'live',
      failed: false,
      transfersStatus: 'active',
      account: {
        id: 'acct_test',
        business_type: 'individual',
        payouts_enabled: true,
        individual: { verification: { status: 'unverified' } },
      },
    },
  });
  assert.equal(assessCourierForNotification(payoutsOnly, now).ready, false);
  assert.equal(selected([payoutsOnly], 'READY_COURIERS').eligible.length, 0);
});

test('agreement, stripe, profile, and inactive filters use courier records', () => {
  const missingAgreement = source({ userId: 'a', email: 'a@example.com', agreementRows: [] });
  const older = source({
    userId: 'b',
    email: 'b@example.com',
    agreementRows: [{ version: 'delivery-agreement-old', contentHash: 'nope', language: 'nl' }],
  });
  const noConnect = source({
    userId: 'c',
    email: 'c@example.com',
    connectAccountId: null,
    onboardingCompleted: false,
    stripe: { source: 'none' },
  });
  const onboarding = source({
    userId: 'd',
    email: 'd@example.com',
    onboardingCompleted: false,
    stripe: { source: 'unavailable' },
  });
  const pending = source({
    userId: 'e',
    email: 'e@example.com',
    stripe: {
      source: 'live',
      failed: false,
      transfersStatus: 'inactive',
      account: {
        id: 'acct_e',
        business_type: 'individual',
        payouts_enabled: true,
        individual: { verification: { status: 'pending' } },
      },
    },
  });
  const incomplete = source({
    userId: 'f',
    email: 'f@example.com',
    isVerified: false,
    transportation: [],
    profile: { ...source().profile, isVerified: false, homeLat: null, homeLng: null },
  });
  const inactive = source({ userId: 'g', email: 'g@example.com', isActive: false });
  const rows = [missingAgreement, older, noConnect, onboarding, pending, incomplete, inactive];
  assert.deepEqual(selected(rows, 'AGREEMENT_MISSING').eligible.map((row) => row.userId).sort(), ['a', 'b']);
  assert.deepEqual(selected(rows, 'STRIPE_CONNECT_MISSING').eligible.map((row) => row.userId), ['c']);
  assert.deepEqual(selected(rows, 'STRIPE_ONBOARDING_INCOMPLETE').eligible.map((row) => row.userId), ['d']);
  assert.deepEqual(selected(rows, 'STRIPE_IDENTITY_UNVERIFIED').eligible.map((row) => row.userId), ['e']);
  assert.equal(selected(rows, 'PROFILE_INCOMPLETE').eligible.some((row) => row.userId === 'f'), true);
  assert.deepEqual(selected(rows, 'INACTIVE_COURIERS').eligible.map((row) => row.userId), ['g']);
});

test('a temporary Stripe failure stays unknown and is not treated as unverified', () => {
  const failed = source({
    stripe: { source: 'live', failed: true, account: null, transfersStatus: null },
  });
  const assessed = assessCourierForNotification(failed, now);
  assert.equal(assessed.connectClass, 'UNKNOWN_OR_TEMPORARILY_UNAVAILABLE');
  assert.equal(assessed.ready, false);
  assert.equal(selected([failed], 'STRIPE_IDENTITY_UNVERIFIED').eligible.length, 0);
  assert.equal(selected([failed], 'READY_COURIERS').eligible.length, 0);
});

test('deleted, suspended, placeholder, and duplicate addresses are excluded', () => {
  const rows = [
    source({ userId: 'live', email: 'live@example.com' }),
    source({ userId: 'gone', email: 'gone@example.com', deleted: true }),
    source({ userId: 'paused', email: 'paused@example.com', suspended: true }),
    source({ userId: 'system-unassigned-delivery', email: 'system@example.com' }),
    source({ userId: 'copy-a', email: 'Same@Example.com' }),
    source({ userId: 'copy-b', email: 'same@example.com' }),
  ];
  const result = selected(rows, 'ALL_EXISTING_COURIERS');
  assert.deepEqual(result.eligible.map((row) => row.userId), ['copy-a', 'live']);
  const reasons = result.excluded.map((row) => row.reason);
  assert.equal(reasons.includes('Verwijderd account'), true);
  assert.equal(reasons.includes('Geschorst account'), true);
  assert.equal(reasons.includes('Systeemprofiel'), true);
  assert.equal(reasons.includes('Dubbel e-mailadres'), true);
});

test('vehicle, area, activity, and role overlap stay one recipient', () => {
  const bike = source({ userId: 'bike', email: 'bike@example.com', city: 'Vlaardingen', transportation: ['BIKE'] });
  const car = source({
    userId: 'car',
    email: 'car@example.com',
    city: 'Den Haag',
    transportation: ['CAR'],
    lastActivity: new Date('2026-01-01T00:00:00Z'),
  });
  const both = source({
    userId: 'both',
    email: 'both@example.com',
    city: 'Rotterdam',
    nationalCoverage: true,
    transportation: ['SCOOTER', 'CAR'],
  });
  const filtered = selected([bike, car, both], 'ACTIVE_COURIERS', {
    vehicle: 'CAR',
    area: 'den haag',
    activeWithinDays: 30,
  });
  assert.deepEqual(filtered.eligible.map((row) => row.userId), []);
  const area = selected([bike, car, both], 'ACTIVE_COURIERS', { vehicle: 'BIKE', area: 'vlaardingen' });
  assert.deepEqual(area.eligible.map((row) => row.userId), ['bike']);
  const national = selected([both], 'ALL_EXISTING_COURIERS', { area: 'nederland' });
  assert.deepEqual(national.eligible.map((row) => row.userId), ['both']);
  const recent = selected([bike, car], 'ALL_EXISTING_COURIERS', { activeWithinDays: 30 });
  assert.deepEqual(recent.eligible.map((row) => row.userId), ['bike']);
});

test('reactivation requires marketing consent and the snapshot cannot grow', () => {
  const optedOut = source({ userId: 'out', email: 'out@example.com', isActive: false, marketingAccepted: false });
  const optedIn = source({ userId: 'in', email: 'in@example.com', isActive: false, marketingAccepted: true });
  const result = selected([optedOut, optedIn], 'INACTIVE_COURIERS', { templateId: 'COURIER_REACTIVATION' });
  assert.deepEqual(result.eligible.map((row) => row.userId), ['in']);
  const parsed = parseCourierNotificationQuery({ segment: 'INACTIVE_COURIERS', templateId: 'COURIER_REACTIVATION' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const token = signCourierRecipientSnapshot({ ids: ['in'], key: JSON.stringify(parsed.query) }, secret);
  const read = readCourierRecipientSnapshot(token, secret, now.getTime());
  assert.equal(read.ok, true);
  if (!read.ok) return;
  assert.deepEqual(intersectCourierSnapshot(['in', 'new-courier'], read.snapshot.ids), ['in']);
  assert.equal(readCourierRecipientSnapshot(`${token}x`, secret).ok, false);
});

test('courier templates do not promise public delivery or earnings', () => {
  for (const template of COURIER_EMAIL_TEMPLATES) {
    const text = `${template.subject}\n${template.message}`.toLowerCase();
    assert.equal(text.includes('gegarandeerd'), false);
    assert.equal(text.includes('al beschikbaar'), false);
    assert.match(template.message, /niet openbaar beschikbaar|nog niet openbaar/);
  }
  const reactivation = COURIER_EMAIL_TEMPLATES.find((template) => template.id === 'COURIER_REACTIVATION');
  assert.equal(reactivation?.promotional, true);
  assert.match(reactivation?.message || '', /Uitschrijven/);
  const route = readFileSync('app/api/admin/notifications/send/route.ts', 'utf8');
  assert.match(route, /role: 'SELLER'/);
  assert.match(route, /role: 'BUYER'/);
  assert.match(route, /recipientSnapshot/);
  assert.equal(route.includes("role: 'DELIVERY'"), false);
});
