import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  composeHouseNumber,
  formatPhysicalDeliveryAddress,
  fulfillmentRequiresPhysicalDeliveryAddress,
  hasGeocodedLocation,
  isCompletePhysicalDeliveryAddress,
  isValidHouseNumber,
  validatePhysicalDeliveryAddress,
} from './physical-delivery-address';

describe('house number', () => {
  it('accepts numbers with optional suffixes', () => {
    assert.equal(isValidHouseNumber('12'), true);
    assert.equal(isValidHouseNumber('12A'), true);
    assert.equal(isValidHouseNumber('12 bis'), true);
    assert.equal(isValidHouseNumber('12-2'), true);
    assert.equal(isValidHouseNumber('Frieslandlaan'), false);
    assert.equal(isValidHouseNumber(''), false);
  });

  it('composes optional suffix', () => {
    assert.equal(composeHouseNumber('12', 'A'), '12A');
    assert.equal(composeHouseNumber('12', 'bis'), '12 bis');
    assert.equal(composeHouseNumber('12A', 'A'), '12A');
  });
});

describe('physical delivery completeness', () => {
  it('treats geocode without house number as incomplete', () => {
    const input = {
      street: 'Frieslandlaan',
      houseNumber: '',
      postalCode: '3137GE',
      city: 'Vlaardingen',
      country: 'NL',
      lat: 51.9,
      lng: 4.3,
    };
    assert.equal(hasGeocodedLocation(input), true);
    assert.equal(isCompletePhysicalDeliveryAddress(input), false);
    assert.deepEqual(validatePhysicalDeliveryAddress(input), ['houseNumber']);
  });

  it('accepts a complete NL address', () => {
    const input = {
      street: 'Frieslandlaan',
      houseNumber: '14',
      postalCode: '3137 GE',
      city: 'Vlaardingen',
      country: 'NL',
      lat: 51.9,
      lng: 4.3,
    };
    assert.equal(isCompletePhysicalDeliveryAddress(input), true);
    assert.equal(
      formatPhysicalDeliveryAddress(input),
      'Frieslandlaan 14, 3137GE Vlaardingen',
    );
  });

  it('does not require address for pickup', () => {
    assert.equal(fulfillmentRequiresPhysicalDeliveryAddress('pickup'), false);
    assert.equal(fulfillmentRequiresPhysicalDeliveryAddress('local_provider'), true);
    assert.equal(fulfillmentRequiresPhysicalDeliveryAddress('shipping'), true);
  });
});
