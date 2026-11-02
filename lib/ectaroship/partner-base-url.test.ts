import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ECTAROSHIP_CANONICAL_PARTNER_BASE_URL,
  resolveEctaroShipPartnerBaseUrl,
  serializePartnerAddress,
} from './partner-client';

describe('EctaroShip Partner base URL', () => {
  it('defaults to canonical Partner API', () => {
    assert.equal(
      resolveEctaroShipPartnerBaseUrl(undefined),
      ECTAROSHIP_CANONICAL_PARTNER_BASE_URL,
    );
  });

  it('maps legacy api.ectaroship.nl to Partner API', () => {
    assert.equal(
      resolveEctaroShipPartnerBaseUrl('https://api.ectaroship.nl'),
      ECTAROSHIP_CANONICAL_PARTNER_BASE_URL,
    );
    assert.equal(
      resolveEctaroShipPartnerBaseUrl('https://api.ectaroship.nl/'),
      ECTAROSHIP_CANONICAL_PARTNER_BASE_URL,
    );
  });

  it('preserves explicit Partner host', () => {
    assert.equal(
      resolveEctaroShipPartnerBaseUrl('https://partnerapi.ectaro.com'),
      'https://partnerapi.ectaro.com',
    );
  });
});

describe('serializePartnerAddress OpenAPI shape', () => {
  it('emits address/houseNo/countryCode and compact NL postcode', () => {
    const out = serializePartnerAddress({
      fullname: 'Buyer',
      countryCode: 'nl',
      city: 'Amsterdam',
      postalCode: '1025 xl',
      street: 'Buikslotermeerplein',
      houseNumber: '200',
    });
    assert.equal(out.address, 'Buikslotermeerplein');
    assert.equal(out.houseNo, '200');
    assert.equal(out.countryCode, 'NL');
    assert.equal(out.postalCode, '1025XL');
    assert.equal('street' in out, false);
    assert.equal('houseNumber' in out, false);
  });
});
