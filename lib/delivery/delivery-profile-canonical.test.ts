import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCanonicalSettingsUpdate,
  hasCanonicalAvailability,
  normalizeWorkTime,
  resolveCanonicalServiceCoords,
  serializeCanonicalSettingsProfile,
} from '@/lib/delivery/delivery-profile-canonical';

const existing = {
  isActive: true,
  isOnline: false,
  homeLat: 51.91,
  homeLng: 4.34,
  homeAddress: 'Vlaardingen',
  maxDistance: 10,
  preferredRadius: 10,
  nationalCoverage: false,
  deliveryMode: 'FIXED',
  availableDays: ['maandag'],
  availableTimeSlots: ['morning'],
  workStartTime: '09:00',
  workEndTime: '21:00',
  pricingEnabled: true,
  baseFeeCents: 250,
  pricePerKmCents: 75,
  minimumFeeCents: 300,
  freeDeliveryRadiusKm: 0,
  currency: 'EUR',
  providerType: 'INDEPENDENT',
  companyDisplayName: null,
  isVerified: true,
  transportation: ['BIKE'],
  deliveryRegions: [],
  bio: 'ok',
  acceptanceMode: 'MANUAL_CONFIRM',
  maxSimultaneousDeliveries: 3,
  maxDeliveriesPerSlot: 2,
  preparationTimeMinutes: 15,
  estimatedPickupDelayMinutes: 10,
};

describe('canonical delivery settings write', () => {
  it('partial update of days does not null pricing or home', () => {
    const { data, error } = buildCanonicalSettingsUpdate({
      body: { availableDays: ['vrijdag'] },
      existing,
    });
    assert.equal(error, undefined);
    assert.deepEqual(data.availableDays, ['vrijdag']);
    assert.equal(data.baseFeeCents, undefined);
    assert.equal(data.homeLat, undefined);
    assert.equal(data.workStartTime, undefined);
    assert.equal(data.pricePerKmCents, undefined);
  });

  it('persists preferredRadius and deliveryMode', () => {
    const { data } = buildCanonicalSettingsUpdate({
      body: { preferredRadius: 8, deliveryMode: 'DYNAMIC', maxDistance: 12 },
      existing,
    });
    assert.equal(data.preferredRadius, 8);
    assert.equal(data.deliveryMode, 'DYNAMIC');
    assert.equal(data.maxDistance, 12);
  });

  it('maps STATIC deliveryMode to FIXED', () => {
    const { data } = buildCanonicalSettingsUpdate({
      body: { deliveryMode: 'STATIC' },
      existing,
    });
    assert.equal(data.deliveryMode, 'FIXED');
  });

  it('normalizes work times and rejects invalid', () => {
    assert.equal(normalizeWorkTime('9:00'), '09:00');
    assert.equal(normalizeWorkTime('null'), null);
    const bad = buildCanonicalSettingsUpdate({
      body: { workStartTime: '25:99' },
      existing,
    });
    assert.equal(bad.error?.includes('Begintijd'), true);
  });

  it('backfills home from User when profile home is missing', () => {
    const { data } = buildCanonicalSettingsUpdate({
      body: { availableDays: ['maandag'] },
      existing: { ...existing, homeLat: null, homeLng: null },
      user: { lat: 52.1, lng: 4.2, place: 'Amsterdam' },
    });
    assert.equal(data.homeLat, 52.1);
    assert.equal(data.homeLng, 4.2);
  });

  it('coerces euro-cents from numeric strings', () => {
    const { data } = buildCanonicalSettingsUpdate({
      body: { baseFeeCents: '350', pricePerKmCents: 80.2, minimumFeeCents: 495 },
      existing,
    });
    assert.equal(data.baseFeeCents, 350);
    assert.equal(data.pricePerKmCents, 80);
    assert.equal(data.minimumFeeCents, 495);
  });
});

describe('canonical availability + coords', () => {
  it('requires days plus slots or work hours', () => {
    assert.equal(
      hasCanonicalAvailability({
        availableDays: ['maandag'],
        availableTimeSlots: [],
        workStartTime: '09:00',
        workEndTime: '21:00',
      }),
      true,
    );
    assert.equal(
      hasCanonicalAvailability({
        availableDays: [],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '21:00',
      }),
      false,
    );
  });

  it('prefers DeliveryProfile home over User', () => {
    const coords = resolveCanonicalServiceCoords(
      { homeLat: 51.9, homeLng: 4.3 },
      { lat: 1, lng: 2 },
    );
    assert.equal(coords?.source, 'home');
    assert.equal(coords?.lat, 51.9);
  });
});

describe('canonical GET serialization', () => {
  it('exposes both availableTimes and availableTimeSlots plus home and cents', () => {
    const serialized = serializeCanonicalSettingsProfile({
      id: 'p1',
      isActive: true,
      isOnline: false,
      maxDistance: 10,
      preferredRadius: null,
      homeLat: 51.9,
      homeLng: 4.3,
      homeAddress: 'x',
      availableDays: ['maandag'],
      availableTimeSlots: ['morning'],
      transportation: ['BIKE'],
      deliveryRegions: [],
      deliveryMode: 'STATIC',
      gpsTrackingEnabled: false,
      currentLat: null,
      currentLng: null,
      bio: null,
      totalDeliveries: 0,
      averageRating: null,
      totalEarnings: 0,
      createdAt: new Date('2026-01-01'),
      acceptanceMode: 'MANUAL_CONFIRM',
      providerType: 'INDEPENDENT',
      companyDisplayName: null,
      workStartTime: '09:00',
      workEndTime: '18:00',
      temporaryOffline: false,
      vacationStart: null,
      vacationEnd: null,
      maxSimultaneousDeliveries: 3,
      maxDeliveriesPerSlot: 2,
      preparationTimeMinutes: 15,
      estimatedPickupDelayMinutes: 10,
      pricingEnabled: true,
      baseFeeCents: 250,
      pricePerKmCents: 75,
      minimumFeeCents: 300,
      freeDeliveryRadiusKm: 0,
      currency: 'EUR',
      nationalCoverage: false,
      isVerified: true,
    });
    assert.deepEqual(serialized.availableTimes, ['morning']);
    assert.deepEqual(serialized.availableTimeSlots, ['morning']);
    assert.equal(serialized.preferredRadius, 10);
    assert.equal(serialized.deliveryMode, 'FIXED');
    assert.equal(serialized.homeLat, 51.9);
    assert.equal(serialized.baseFeeCents, 250);
    assert.equal(serialized.workStartTime, '09:00');
  });
});
