import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  planUnpaidDestinationChange,
  sameConfirmedDestination,
} from './booking-destination-change';

describe('unpaid checkout destination change', () => {
  it('keeps a booking when the same confirmed place is loaded again', () => {
    assert.equal(
      sameConfirmedDestination({ lat: 52.3731, lng: 4.8926 }, { lat: 52.3731, lng: 4.8926 }),
      true,
    );
    assert.equal(
      planUnpaidDestinationChange({
        status: 'PENDING',
        currentLat: 52.3731,
        currentLng: 4.8926,
        nextLat: 52.3731,
        nextLng: 4.8926,
      }),
      'keep',
    );
  });

  it('does not retire while the address is still being typed', () => {
    assert.equal(
      planUnpaidDestinationChange({
        status: 'PENDING',
        currentLat: 52.3731,
        currentLng: 4.8926,
        nextLat: null,
        nextLng: null,
      }),
      'keep',
    );
  });

  it('retires an unpaid Damrak booking when Utrecht is confirmed', () => {
    assert.equal(
      planUnpaidDestinationChange({
        status: 'PENDING',
        currentLat: 52.3731,
        currentLng: 4.8926,
        nextLat: 52.0934,
        nextLng: 5.1215,
      }),
      'retire',
    );
  });

  it('retires an unpaid booking even when the same courier can reach the new address', () => {
    assert.equal(
      planUnpaidDestinationChange({
        status: 'ACCEPTED',
        currentLat: 52.3731,
        currentLng: 4.8926,
        nextLat: 52.478,
        nextLng: 4.8952,
      }),
      'retire',
    );
    assert.equal(
      planUnpaidDestinationChange({
        status: 'AUTO_CONFIRMED',
        currentLat: 52.3731,
        currentLng: 4.8926,
        nextLat: 52.4,
        nextLng: 4.9,
      }),
      'retire',
    );
  });

  it('leaves a paid booking and an already closed booking alone', () => {
    for (const status of ['CONSUMED', 'CANCELLED', 'REJECTED', 'EXPIRED']) {
      assert.equal(
        planUnpaidDestinationChange({
          status,
          currentLat: 52.3731,
          currentLng: 4.8926,
          nextLat: 52.0934,
          nextLng: 5.1215,
        }),
        'keep',
      );
    }
  });

  it('a late accept cannot leave the product hold waiting for payment', () => {
    const service = readFileSync('lib/delivery/booking-request-service.ts', 'utf8');
    const retire = service.slice(service.indexOf('export async function retireUnpaidBookingForDestinationChange'));
    const accept = service.slice(
      service.indexOf('export async function acceptDeliveryBookingRequest'),
      service.indexOf('export async function rejectDeliveryBookingRequest'),
    );
    assert.match(retire, /phase: 'AWAITING_COURIER'/);
    assert.match(retire, /paymentDeadline: null/);
    assert.match(retire, /status: 'CANCELLED'/);
    assert.equal(retire.includes("status: 'CANCELLED'") && retire.includes('stockReservation.update'), true);
    assert.match(accept, /status === 'CANCELLED'/);
    assert.match(accept, /DELIVERY_DESTINATION_CHANGED/);
    const windowCall = accept.indexOf('openPaymentWindowForBooking');
    const pendingGuard = accept.indexOf("status: 'PENDING'");
    assert.equal(pendingGuard >= 0 && windowCall > pendingGuard, true);
    const checkout = readFileSync('app/checkout/page.tsx', 'utf8');
    assert.match(checkout, /destinationChange: true/);
    assert.match(checkout, /sameConfirmedDestination/);
  });
});
