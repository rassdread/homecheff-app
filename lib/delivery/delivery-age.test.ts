import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COMMERCIAL_DELIVERY_MIN_AGE,
  resolveDeliveryAgeStatus,
  shouldEmitDeliveryAgeConfirmation,
} from '@/lib/delivery/delivery-age';

const adultDob = new Date(Date.UTC(1990, 5, 15, 12, 0, 0));
const minorDob = new Date(Date.UTC(2010, 0, 1, 12, 0, 0));
const now = new Date(Date.UTC(2026, 8, 17, 12, 0, 0));

describe('canonical delivery age status', () => {
  it('keeps commercial min age at 18', () => {
    assert.equal(COMMERCIAL_DELIVERY_MIN_AGE, 18);
  });

  it('maps verified User.dateOfBirth >= 18 to VERIFIED_18_PLUS', () => {
    const age = resolveDeliveryAgeStatus({ dateOfBirth: adultDob, now });
    assert.equal(age.status, 'VERIFIED_18_PLUS');
    assert.equal(age.source, 'USER_DATE_OF_BIRTH');
    assert.equal(age.verified, true);
    assert.equal(age.dateOfBirthPresent, true);
    assert.deepEqual(age.requirementMissing, []);
    assert.equal(age.ageYears != null && age.ageYears >= 18, true);
  });

  it('maps verified User.dateOfBirth < 18 to UNDER_18, not UNKNOWN', () => {
    const age = resolveDeliveryAgeStatus({ dateOfBirth: minorDob, now });
    assert.equal(age.status, 'UNDER_18');
    assert.equal(age.source, 'USER_DATE_OF_BIRTH');
    assert.equal(age.verified, true);
    assert.equal(age.dateOfBirthPresent, true);
    assert.deepEqual(age.requirementMissing, ['under18']);
    assert.equal(age.requirementMissing.includes('dateOfBirth'), false);
  });

  it('maps missing DOB to UNKNOWN', () => {
    const age = resolveDeliveryAgeStatus({ dateOfBirth: null, now });
    assert.equal(age.status, 'UNKNOWN');
    assert.equal(age.source, 'NONE');
    assert.equal(age.verified, false);
    assert.deepEqual(age.requirementMissing, ['dateOfBirth']);
  });

  it('emits leeftijd-bevestigen only for delivery users with UNKNOWN age', () => {
    const unknown = resolveDeliveryAgeStatus({ dateOfBirth: null, now });
    const adult = resolveDeliveryAgeStatus({ dateOfBirth: adultDob, now });
    const minor = resolveDeliveryAgeStatus({ dateOfBirth: minorDob, now });

    assert.equal(
      shouldEmitDeliveryAgeConfirmation({ hasDeliveryProfile: true, age: unknown }),
      true,
    );
    assert.equal(
      shouldEmitDeliveryAgeConfirmation({ hasDeliveryProfile: true, age: adult }),
      false,
    );
    assert.equal(
      shouldEmitDeliveryAgeConfirmation({ hasDeliveryProfile: true, age: minor }),
      false,
    );
    assert.equal(
      shouldEmitDeliveryAgeConfirmation({ hasDeliveryProfile: false, age: unknown }),
      false,
    );
  });
});
