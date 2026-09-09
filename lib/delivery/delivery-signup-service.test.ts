/**
 * Delivery onboarding validation + flow unit tests (no DB required for A–I logic gates).
 * Run: npx tsx --test lib/delivery/delivery-signup-service.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterValidTransportation,
  parseAndValidateDeliverySignupFields,
  VALID_TRANSPORTATION_MODES,
} from './delivery-signup-validation';
import { COMMERCIAL_DELIVERY_MIN_AGE } from './delivery-age';

describe('delivery signup validation', () => {
  it('F: missing required fields → inline fieldErrors', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        acceptDeliveryAgreement: false,
        transportation: [],
      },
      { requireAccountFields: true }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.result.code, 'VALIDATION');
    assert.ok(result.result.fieldErrors);
    assert.ok(result.result.fieldErrors?.name);
    assert.ok(result.result.fieldErrors?.email);
    assert.ok(result.result.fieldErrors?.transportation);
    assert.ok(result.result.fieldErrors?.acceptDeliveryAgreement);
  });

  it('H: under 18 blocked before create', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Teen',
        email: 'teen@example.com',
        password: 'secret12',
        username: 'teen_user',
        age: 17,
        transportation: ['BIKE'],
        acceptDeliveryAgreement: true,
      },
      { requireAccountFields: true }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.result.code, 'UNDERAGE');
    assert.equal(result.result.status, 403);
  });

  it('I: 18+ particular fields parse OK', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Ada',
        email: ' ada@Example.COM ',
        password: 'secret12',
        username: 'Ada_Rider',
        age: COMMERCIAL_DELIVERY_MIN_AGE,
        transportation: ['BIKE', 'WALKING', 'CAR'],
        acceptDeliveryAgreement: true,
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
      },
      { requireAccountFields: true }
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.email, 'ada@example.com');
    assert.equal(result.data.username, 'ada_rider');
    assert.deepEqual(result.data.transportation, ['BIKE', 'CAR']);
    assert.equal(result.data.providerType, 'INDEPENDENT');
  });

  it('B: business requires company + kvk; btw optional', () => {
    const missing = parseAndValidateDeliverySignupFields(
      {
        name: 'Boss',
        email: 'boss@example.com',
        password: 'secret12',
        username: 'boss_co',
        age: 30,
        transportation: ['CAR'],
        acceptDeliveryAgreement: true,
        providerType: 'DELIVERY_BUSINESS',
      },
      { requireAccountFields: true }
    );
    assert.equal(missing.ok, false);
    if (missing.ok) return;
    assert.ok(missing.result.fieldErrors?.companyName);
    assert.ok(missing.result.fieldErrors?.kvkNumber);

    const ok = parseAndValidateDeliverySignupFields(
      {
        name: 'Boss',
        email: 'boss@example.com',
        password: 'secret12',
        username: 'boss_co',
        age: 30,
        transportation: ['CAR'],
        acceptDeliveryAgreement: true,
        providerType: 'DELIVERY_BUSINESS',
        companyName: 'SnelBezorg BV',
        kvkNumber: '12345678',
      },
      { requireAccountFields: true }
    );
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.data.providerType, 'DELIVERY_BUSINESS');
    assert.equal(ok.data.companyName, 'SnelBezorg BV');
    assert.equal(ok.data.kvkNumber, '12345678');
    assert.equal(ok.data.vatNumber, null);
  });

  it('strips invalid transportation enums (Prisma-safe)', () => {
    assert.deepEqual(filterValidTransportation(['BIKE', 'PUBLIC_TRANSPORT', 'WALKING']), [
      'BIKE',
    ]);
    assert.deepEqual([...VALID_TRANSPORTATION_MODES].sort(), [
      'BIKE',
      'CAR',
      'EBIKE',
      'SCOOTER',
    ]);
  });

  it('existing-user path does not require account fields', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        age: 22,
        transportation: ['EBIKE'],
        acceptDeliveryAgreement: true,
      },
      { requireAccountFields: false }
    );
    assert.equal(result.ok, true);
  });
});
