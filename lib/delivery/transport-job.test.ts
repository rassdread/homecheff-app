import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  applyProposalAction,
  areaFromAddress,
  canReadCargoPhoto,
  agreedTransportPrice,
  checkoutAllowed,
  checkoutSessionStillCurrent,
  confirmedDrivingRoute,
  payoutAllowed,
  transportCheckoutAmounts,
  publicJobView,
  standaloneWebhookDecision,
  transportPaymentReviewReason,
  transportReceivedPaymentDisposition,
  transportCheckoutFlagDecision,
  transportProposalsEnabled,
  validateCargoPhoto,
  gramsToKilograms,
  interpretStoredCapacity,
  kilogramsToGrams,
  normalizeVehicleCapacity,
  vehicleFits,
  type ProposalVersion,
  type TransportCargo,
} from './transport-job';

const cargo: TransportCargo = {
  itemCount: 1,
  items: [{ lengthCm: 120, widthCm: 80, heightCm: 60, weightKg: 25 }],
  totalWeightKg: 25,
  floors: 2,
  lift: false,
  helpNeeded: true,
  fragile: true,
  note: 'Kast',
  preferredVehicle: 'VAN',
  photoIds: ['photo_1'],
};

const future = new Date('2026-11-11T12:00:00.000Z');
const now = new Date('2026-11-10T12:00:00.000Z');

function offer(price = 4500): ProposalVersion[] {
  const result = applyProposalAction({
    versions: [],
    expectedVersion: 0,
    actorRole: 'CUSTOMER',
    action: 'OFFER',
    priceCents: price,
    negotiable: false,
    now,
    expiresAt: future,
  });
  assert.equal(result.ok, true);
  return result.ok ? result.versions : [];
}

test('simple package flow does not need transport fields or a proposal', () => {
  assert.deepEqual(checkoutAllowed({ jobKind: 'SIMPLE', bookingStatus: 'ACCEPTED', proposalAccepted: false }), { ok: true });
  assert.deepEqual(checkoutAllowed({ jobKind: 'SIMPLE', bookingStatus: 'AUTO_CONFIRMED', proposalAccepted: false }), { ok: true });
});

test('google place addresses stay hidden until payment and coordinates are never public', () => {
  assert.equal(areaFromAddress('Teststraat 12, 3511 AB Utrecht'), '3511 Utrecht');
  const view = publicJobView({
    pickupAddress: 'Koerierstraat 4, 3511 CD Utrecht',
    deliveryAddress: 'Damrak 1, 1012 LG Amsterdam',
    paid: false,
    pickupLat: 52.09,
    pickupLng: 5.12,
    dropoffLat: 52.37,
    dropoffLng: 4.89,
  });
  assert.equal(view.pickupAddress, null);
  assert.equal(view.deliveryAddress, null);
  assert.equal(JSON.stringify(view).includes('52.09'), false);
  assert.equal(JSON.stringify(view).includes('Koerierstraat'), false);
  const paid = publicJobView({ ...view, pickupAddress: 'Koerierstraat 4, 3511 CD Utrecht', deliveryAddress: 'Damrak 1, 1012 LG Amsterdam', paid: true });
  assert.equal(paid.pickupAddress?.includes('Koerierstraat'), true);
});

test('cargo photos are private and typed', () => {
  assert.equal(validateCargoPhoto({ mimeType: 'image/jpeg', sizeBytes: 1000 }).ok, true);
  assert.equal(validateCargoPhoto({ mimeType: 'text/html', sizeBytes: 1000 }).ok, false);
  assert.equal(validateCargoPhoto({ mimeType: 'image/png', sizeBytes: 9 * 1024 * 1024 }).ok, false);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'buyer', courierUserId: 'courier', paid: false }), true);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'courier', courierUserId: 'courier', paid: false }), false);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'courier', courierUserId: 'courier', paid: false, assigned: true }), true);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'courier', courierUserId: 'courier', paid: true }), true);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'courier', courierUserId: 'courier', paid: true, assigned: true, closed: true }), false);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'other', courierUserId: 'courier', paid: false, assigned: true }), false);
  assert.equal(canReadCargoPhoto({ ownerUserId: 'buyer', viewerUserId: 'stranger', courierUserId: 'courier', paid: true }), false);
});

const measured = {
  length: 'set',
  width: 'set',
  height: 'set',
  weight: 'set',
} as const;

test('vehicle capacity, dimensions and missing data', () => {
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: measured }), 'fit');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: 100, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: measured }), 'too_small');
  assert.equal(vehicleFits(cargo, { modes: ['BIKE'], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: measured }), 'wrong_type');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: null, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: { ...measured, length: 'unset' } }), 'missing_data');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: { ...measured, length: 'unknown' } }), 'unknown');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: null, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: { ...measured, length: 'not_applicable' } }), 'fit');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000 }), 'fit');
  assert.equal(vehicleFits(cargo, { modes: [], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: measured }), 'missing_data');
  assert.equal(vehicleFits(cargo, { modes: ['VAN'], maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 120, maxWeightGrams: 400_000, status: { ...measured, extra: 'set' } as never }), 'missing_data');
  assert.equal(normalizeVehicleCapacity({ maxLengthCm: 1.5, status: measured }).ok, false);
  assert.equal(normalizeVehicleCapacity({ maxLengthCm: -4, status: measured }).ok, false);
  assert.equal(normalizeVehicleCapacity({ status: { ...measured, note: 'set' } }).ok, false);
});

test('capacity numbers without an explicit status are not measurements', () => {
  const blocked = normalizeVehicleCapacity({ maxLengthCm: 200, maxWidthCm: 120, maxHeightCm: 100, maxWeightKg: 400 });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, 'STATUS_REQUIRED');
  const cleared = normalizeVehicleCapacity({
    status: { length: 'unknown', width: 'unset', height: 'not_applicable', weight: 'set' },
    maxWeightKg: 400,
  });
  assert.equal(cleared.ok, true);
  if (cleared.ok) {
    assert.equal(cleared.maxLengthCm, null);
    assert.equal(cleared.maxWeightGrams, 400_000);
    assert.equal(cleared.status.weight, 'set');
  }
  assert.equal(kilogramsToGrams(400), 400_000);
  assert.equal(gramsToKilograms(400_000), 400);
  assert.equal(kilogramsToGrams(0), null);
  assert.equal(kilogramsToGrams(10_001), null);
  const legacy = interpretStoredCapacity({
    maxLengthCm: 200,
    maxWidthCm: 120,
    maxHeightCm: 120,
    maxWeightGrams: 400_000,
    status: null,
  });
  assert.equal(legacy.legacy, true);
  assert.equal(legacy.status.weight, 'legacy');
  assert.equal(legacy.maxWeightGrams, 400_000);
  const source = readFileSync(new URL('./standalone-delivery.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('vehicleCargoNote'), false);
  assert.equal(source.includes('product.lengthCm'), false);
  assert.equal(source.includes('weightGrams'), false);
  const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
  assert.equal(schema.includes('vehicleCargoNote'), false);
  assert.match(schema, /jobKind\s+String\s+@default\("SIMPLE"\)/);
});

test('proposal accept, reject, counter, conflict and expiry', () => {
  const accepted = applyProposalAction({
    versions: offer(),
    expectedVersion: 1,
    actorRole: 'COURIER',
    action: 'ACCEPT',
    priceCents: null,
    negotiable: false,
    now,
    expiresAt: future,
  });
  assert.equal(accepted.ok && accepted.paymentAllowed, true);
  assert.equal(accepted.ok && accepted.agreedPriceCents, 4500);

  const rejected = applyProposalAction({
    versions: offer(),
    expectedVersion: 1,
    actorRole: 'COURIER',
    action: 'REJECT',
    priceCents: null,
    negotiable: false,
    now,
    expiresAt: future,
  });
  assert.equal(rejected.ok && rejected.paymentAllowed, false);

  const counter = applyProposalAction({
    versions: offer(),
    expectedVersion: 1,
    actorRole: 'COURIER',
    action: 'COUNTER',
    priceCents: 5200,
    negotiable: false,
    now,
    expiresAt: future,
  });
  assert.equal(counter.ok && counter.versions.at(-1)?.priceCents, 5200);
  assert.equal(counter.ok && counter.versions[0]?.status, 'SUPERSEDED');

  const conflict = applyProposalAction({
    versions: offer(),
    expectedVersion: 0,
    actorRole: 'COURIER',
    action: 'ACCEPT',
    priceCents: null,
    negotiable: false,
    now,
    expiresAt: future,
  });
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.code, 'VERSION_CONFLICT');

  const expired = applyProposalAction({
    versions: offer(),
    expectedVersion: 1,
    actorRole: 'COURIER',
    action: 'ACCEPT',
    priceCents: null,
    negotiable: false,
    now: new Date('2026-11-12T12:00:00.000Z'),
    expiresAt: future,
  });
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.code, 'PROPOSAL_EXPIRED');
});

test('a straight-line fallback is not a confirmed driving route and an agreed price is not replaced', () => {
  const straight = confirmedDrivingRoute({ distance: 8, source: 'straight_line' });
  const google = confirmedDrivingRoute({ distance: 8.4, source: 'google' });
  assert.equal(straight.confirmed, false);
  if (!straight.confirmed) assert.match(straight.message, /conceptvoorstel/);
  assert.equal(google.confirmed, true);
  const accepted = applyProposalAction({
    versions: offer(),
    expectedVersion: 1,
    actorRole: 'COURIER',
    action: 'ACCEPT',
    priceCents: null,
    negotiable: false,
    now: new Date('2026-11-10T12:00:00.000Z'),
    expiresAt: new Date('2026-11-12T12:00:00.000Z'),
  });
  assert.equal(accepted.ok, true);
  if (!accepted.ok) return;
  const agreed = agreedTransportPrice(accepted.versions);
  assert.deepEqual(agreed, { version: 2, priceCents: 4500 });
  const amounts = transportCheckoutAmounts(agreed!.priceCents);
  assert.equal(amounts.agreedCents, 4500);
  assert.equal(amounts.platformCommissionCents, 540);
  assert.equal(amounts.courierCents, 3960);
  assert.equal(amounts.currency, 'eur');
  assert.equal(amounts.buyerTotalCents, amounts.agreedCents + amounts.stripeFeeCents);
  const revised = applyProposalAction({
    versions: accepted.versions,
    expectedVersion: 2,
    actorRole: 'CUSTOMER',
    action: 'REVISE',
    priceCents: 5200,
    negotiable: false,
    now: new Date('2026-11-10T13:00:00.000Z'),
    expiresAt: new Date('2026-11-12T13:00:00.000Z'),
  });
  assert.equal(revised.ok && revised.paymentAllowed, false);
  if (revised.ok) assert.equal(agreedTransportPrice(revised.versions), null);
  assert.equal(checkoutSessionStillCurrent({
    sessionProposalVersion: '2',
    sessionBuyerTotalCents: amounts.buyerTotalCents,
    acceptedVersion: 2,
    buyerTotalCents: amounts.buyerTotalCents,
  }), true);
  assert.equal(checkoutSessionStillCurrent({
    sessionProposalVersion: '2',
    sessionBuyerTotalCents: amounts.buyerTotalCents,
    acceptedVersion: 4,
    buyerTotalCents: transportCheckoutAmounts(5200).buyerTotalCents,
  }), false);
  const stale = standaloneWebhookDecision({
    livemode: false,
    platformIsTestMode: true,
    paymentStatus: 'paid',
    currency: 'eur',
    amountTotal: amounts.buyerTotalCents,
    metadataUserId: 'buyer',
    requestUserId: 'buyer',
    buyerTotalCents: amounts.buyerTotalCents,
    alreadyFulfilled: false,
    acceptedProposalVersion: null,
    paidProposalVersion: 2,
  });
  assert.equal(stale, 'stale_version');
  const distanceSource = readFileSync(new URL('../google-maps-distance.ts', import.meta.url), 'utf8');
  assert.equal(distanceSource.includes('distanceSource'), true);
  const schedule = readFileSync(new URL('./booking-schedule.ts', import.meta.url), 'utf8');
  assert.equal(schedule.includes("distanceSource === 'google'"), true);
  assert.equal(schedule.includes('straight_line'), true);
});

test('a received payment for an old proposal is recorded once and is not a refund or a retry', () => {
  const paid = {
    livemode: false,
    platformIsTestMode: true,
    paymentStatus: 'paid',
    currency: 'eur',
    amountTotal: 5000,
    metadataUserId: 'buyer',
    requestUserId: 'buyer',
    buyerTotalCents: 6200,
    alreadyFulfilled: false,
    reviewRecorded: false,
    acceptedProposalVersion: null as number | null,
    paidProposalVersion: 2,
  };
  assert.equal(transportReceivedPaymentDisposition(paid), 'review');
  assert.equal(transportReceivedPaymentDisposition({ ...paid, reviewRecorded: true }), 'duplicate_review');
  assert.equal(transportReceivedPaymentDisposition({
    ...paid,
    acceptedProposalVersion: 2,
    buyerTotalCents: 5000,
  }), 'fulfill');
  assert.equal(transportReceivedPaymentDisposition({
    ...paid,
    acceptedProposalVersion: 2,
    buyerTotalCents: 5000,
    alreadyFulfilled: true,
  }), 'duplicate');
  assert.equal(transportPaymentReviewReason({
    acceptedProposalVersion: null,
    paidProposalVersion: 2,
    amountTotal: 5000,
    buyerTotalCents: 6200,
  }), 'STALE_PROPOSAL_VERSION');
  const fulfillment = readFileSync(new URL('./standalone-delivery.ts', import.meta.url), 'utf8');
  const webhook = readFileSync(new URL('../../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');
  assert.equal(fulfillment.includes('stripe.refunds.create'), false);
  assert.equal(fulfillment.includes('STANDALONE_PAYMENT_REVIEW_ACTION'), true);
  assert.equal(readFileSync(new URL('./transport-job.ts', import.meta.url), 'utf8').includes('standalone_delivery_payment_review'), true);
  assert.equal(webhook.includes('fulfillStandaloneDeliveryPayment'), true);
  assert.equal(webhook.includes('deliveryWebhookClass'), true);
});

test('payment is blocked before acceptance and allowed after the booking is confirmed', () => {
  assert.equal(checkoutAllowed({ jobKind: 'TRANSPORT', bookingStatus: 'ACCEPTED', proposalAccepted: false }).ok, false);
  assert.equal(checkoutAllowed({ jobKind: 'TRANSPORT', bookingStatus: 'PENDING', proposalAccepted: true }).ok, false);
  assert.deepEqual(checkoutAllowed({ jobKind: 'TRANSPORT', bookingStatus: 'ACCEPTED', proposalAccepted: true }), { ok: true });
});

test('test and live webhooks, duplicates, amount and user', () => {
  const base = {
    paymentStatus: 'paid',
    currency: 'eur',
    amountTotal: 5000,
    metadataUserId: 'buyer',
    requestUserId: 'buyer',
    buyerTotalCents: 5000,
    alreadyFulfilled: false,
  };
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: true }), 'ok');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: true, platformIsTestMode: false }), 'ok');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: true, platformIsTestMode: true }), 'wrong_mode');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: false }), 'wrong_mode');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: true, alreadyFulfilled: true }), 'duplicate');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: true, amountTotal: 1 }), 'wrong_amount');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: true, metadataUserId: 'other' }), 'wrong_user');
  assert.equal(standaloneWebhookDecision({ ...base, livemode: false, platformIsTestMode: true, paymentStatus: 'unpaid' }), 'unpaid');
});

test('cancellation stays review-only and payout waits for delivery', () => {
  const source = readFileSync(new URL('./standalone-cancellation.ts', import.meta.url), 'utf8');
  assert.match(source, /REVIEW_REQUIRED_NO_AUTOMATIC_STRIPE_REFUND/);
  assert.equal(source.includes('stripe.refunds.create'), false);
  assert.equal(payoutAllowed('ACCEPTED'), false);
  assert.equal(payoutAllowed('DELIVERED'), true);
});

test('missing stripe link is not treated as ready and marketplace checkout is untouched', () => {
  const readiness = readFileSync(new URL('./paid-delivery-readiness.ts', import.meta.url), 'utf8');
  assert.match(readiness, /Herstel eerst je Stripe-koppeling/);
  const checkout = readFileSync(new URL('../../app/checkout/page.tsx', import.meta.url), 'utf8');
  assert.equal(checkout.includes('transport-job'), false);
  assert.equal(checkout.includes('DeliveryTransportProposal'), false);
  const fulfill = readFileSync(new URL('./standalone-delivery.ts', import.meta.url), 'utf8');
  assert.match(fulfill, /transportReceivedPaymentDisposition/);
  assert.equal(fulfill.includes("error: 'Live mode refused'"), false);
  assert.equal(fulfill.includes('payout.create'), false);
  assert.equal(transportProposalsEnabled('0'), false);
  assert.equal(transportProposalsEnabled(undefined), false);
  assert.equal(transportProposalsEnabled('1'), true);
  assert.equal(transportCheckoutFlagDecision({ enabled: false, existingSession: false }), 'block_new');
  assert.equal(transportCheckoutFlagDecision({ enabled: false, existingSession: true }), 'continue_existing');
  assert.equal(transportCheckoutFlagDecision({ enabled: true, existingSession: false }), 'allow');
  assert.equal(fulfill.includes("rememberUnfulfilledPayment(db, session, 'TRANSPORT_DISABLED'"), false);
  assert.match(fulfill, /proposalVersion/);
});
