import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateShippingAddressSnapshot } from './address-snapshot';

describe('shipping address snapshot', () => {
  it('requires house number', () => {
    const missing = validateShippingAddressSnapshot({
      name: 'Buyer',
      addressLine: 'Buikslotermeerplein',
      postalCode: '1025XL',
      city: 'Amsterdam',
      country: 'NL',
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, 'SHIPPING_HOUSE_NUMBER_REQUIRED');
  });

  it('parses house number from addressLine', () => {
    const ok = validateShippingAddressSnapshot({
      name: 'Buyer',
      addressLine: 'Buikslotermeerplein 200',
      postalCode: '1025 XL',
      city: 'Amsterdam',
      country: 'NL',
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.address.street, 'Buikslotermeerplein');
      assert.equal(ok.address.houseNumber, '200');
      assert.equal(ok.address.postalCode, '1025XL');
    }
  });

  it('keeps explicit street + houseNumber', () => {
    const ok = validateShippingAddressSnapshot({
      name: 'Buyer',
      street: 'Buikslotermeerplein',
      houseNumber: '200A',
      addressLine: 'ignored when structured present',
      postalCode: '1025XL',
      city: 'Amsterdam',
      country: 'NL',
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.address.street, 'Buikslotermeerplein');
      assert.equal(ok.address.houseNumber, '200A');
    }
  });
});
