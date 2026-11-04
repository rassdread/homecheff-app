import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bookingAcceptAllowed,
  bookingNoticeKey,
  bookingRequestDeepLink,
  courierRequestChannels,
  paidCourierOrderCopy,
  sanitizeBookingRequestId,
  shouldSendBookingNotice,
  viewerMayReadBooking,
  COURIER_REQUEST_COPY,
  PAID_COURIER_ORDER_TITLE,
  paymentFailureTarget,
} from './booking-notice';

test('a five-minute request uses push and email unless email is turned off', () => {
  assert.deepEqual(courierRequestChannels({ hasActivePushToken: true, urgent: true }), ['push', 'email']);
  assert.deepEqual(courierRequestChannels({ hasActivePushToken: false, urgent: true }), ['push', 'email']);
  assert.deepEqual(
    courierRequestChannels({ hasActivePushToken: true, urgent: true, emailDeliveryUpdates: false }),
    ['push'],
  );
  assert.deepEqual(courierRequestChannels({ hasActivePushToken: false }), ['push', 'email']);
  assert.deepEqual(courierRequestChannels({ hasActivePushToken: true }), ['push']);
});

test('a stored notice is not sent again', () => {
  assert.equal(shouldSendBookingNotice(true), false);
  assert.equal(shouldSendBookingNotice(false), true);
  assert.equal(bookingNoticeKey('req_12345678', 'courier_requested'), 'booking:req_12345678:courier_requested');
  assert.notEqual(
    bookingNoticeKey('req_12345678', 'courier_requested'),
    bookingNoticeKey('req_12345678', 'courier_expired'),
  );
});

test('the request link stays on the authenticated dashboard', () => {
  const link = bookingRequestDeepLink('req_12345678');
  assert.equal(link, '/delivery/dashboard?bookingRequestId=req_12345678');
  assert.equal(sanitizeBookingRequestId('req_12345678'), 'req_12345678');
  assert.equal(sanitizeBookingRequestId('../admin'), null);
  assert.equal(sanitizeBookingRequestId('short'), null);
});

test('expired, cancelled and foreign requests cannot be accepted or read', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');
  assert.equal(bookingAcceptAllowed({
    status: 'PENDING',
    expiresAt: '2026-11-04T12:05:00.000Z',
    now,
  }), true);
  assert.equal(bookingAcceptAllowed({
    status: 'PENDING',
    expiresAt: '2026-11-04T11:59:00.000Z',
    now,
  }), false);
  assert.equal(bookingAcceptAllowed({
    status: 'CANCELLED',
    expiresAt: '2026-11-04T12:05:00.000Z',
    now,
  }), false);
  assert.equal(bookingAcceptAllowed({
    status: 'EXPIRED',
    expiresAt: '2026-11-04T12:05:00.000Z',
    now,
  }), false);
  assert.equal(viewerMayReadBooking({
    viewerUserId: 'courier',
    buyerId: 'buyer',
    courierUserId: 'courier',
  }), true);
  assert.equal(viewerMayReadBooking({
    viewerUserId: 'stranger',
    buyerId: 'buyer',
    courierUserId: 'courier',
  }), false);
});

test('request and paid-order copy stay distinct', () => {
  assert.match(COURIER_REQUEST_COPY.title, /wacht|reageer binnen 5 minuten/i);
  assert.equal(COURIER_REQUEST_COPY.body.includes('adres'), false);
  const paid = paidCourierOrderCopy(true, 'HC-1');
  assert.equal(paid.title, PAID_COURIER_ORDER_TITLE);
  assert.match(paid.body, /betaling/i);
  const open = paidCourierOrderCopy(false, 'HC-1');
  assert.match(open.title, /beschikbaar/);
});

test('payment failure needs the buyer and a Stripe event id', () => {
  assert.equal(paymentFailureTarget({ buyerId: 'buyer_1' }, 'evt_1')?.buyerId, 'buyer_1');
  assert.equal(paymentFailureTarget({}, 'evt_1'), null);
  assert.equal(paymentFailureTarget({ buyerId: 'buyer_1' }, ''), null);
});
