import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { isParcelCarrierConfigured } from '../ectaroship/partner-client';

describe('checkout does not invent a delivery price', () => {
  it('refuses a local delivery fee when there is no route', () => {
    const route = readFileSync('app/api/checkout/route.ts', 'utf8');
    assert.equal(route.includes('deliveryFeeCents = 250'), false);
    assert.match(route, /DELIVERY_ROUTE_UNAVAILABLE/);
  });

  it('hides parcel shipping until a carrier key exists', () => {
    const previous = process.env.ECTAROSHIP_API_KEY;
    delete process.env.ECTAROSHIP_API_KEY;
    assert.equal(isParcelCarrierConfigured(), false);
    process.env.ECTAROSHIP_API_KEY = 'test-key';
    assert.equal(isParcelCarrierConfigured(), true);
    if (previous === undefined) delete process.env.ECTAROSHIP_API_KEY;
    else process.env.ECTAROSHIP_API_KEY = previous;
  });
});
