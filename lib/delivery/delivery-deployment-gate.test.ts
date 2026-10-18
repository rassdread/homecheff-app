import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import {
  isHomeCheffDeliveryEnabled,
  isNewCourierFulfillmentMode,
} from './delivery-deployment-gate';
import { POST as bookPost } from '../../app/api/delivery/standalone/book/route';
import { POST as checkoutPost } from '../../app/api/delivery/standalone/checkout/route';
import { POST as bookingPost } from '../../app/api/delivery/booking-requests/route';
import { POST as acceptPost } from '../../app/api/delivery/booking-requests/[id]/accept/route';

const root = new URL('../../', import.meta.url);

function source(path: string) {
  return readFileSync(new URL(path, root), 'utf8');
}

describe('HOMECHEFF_DELIVERY_ENABLED', () => {
  it('treats a missing flag as disabled', () => {
    assert.equal(isHomeCheffDeliveryEnabled({}), false);
  });

  it('treats false and invalid values as disabled', () => {
    for (const value of ['false', '0', 'no', 'off', 'TRUEE', 'enabled', ' ', 'on']) {
      assert.equal(isHomeCheffDeliveryEnabled({ HOMECHEFF_DELIVERY_ENABLED: value }), false, value);
    }
  });

  it('enables only an explicit true, 1, or yes', () => {
    for (const value of ['true', 'TRUE', ' true ', '1', 'yes', 'YES']) {
      assert.equal(isHomeCheffDeliveryEnabled({ HOMECHEFF_DELIVERY_ENABLED: value }), true, value);
    }
  });

  it('recognises only the new courier checkout modes', () => {
    assert.equal(isNewCourierFulfillmentMode('LOCAL_PROVIDER'), true);
    assert.equal(isNewCourierFulfillmentMode('delivery'), true);
    assert.equal(isNewCourierFulfillmentMode('PICKUP'), false);
    assert.equal(isNewCourierFulfillmentMode('SHIPPING'), false);
    assert.equal(isNewCourierFulfillmentMode('SELLER_DELIVERY'), false);
    assert.equal(isNewCourierFulfillmentMode('LOCAL_DELIVERY'), false);
  });
});

describe('new delivery routes stay closed when the gate is off', () => {
  const previous = process.env.HOMECHEFF_DELIVERY_ENABLED;

  async function expectDisabled(response: Response) {
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.code, 'DELIVERY_DISABLED');
  }

  it('rejects standalone booking, payment, and courier booking without auth', async () => {
    delete process.env.HOMECHEFF_DELIVERY_ENABLED;
    const book = () =>
      new NextRequest('http://localhost/api/delivery/standalone/book', {
        method: 'POST',
        body: JSON.stringify({ deliveryProfileId: 'x' }),
      });
    const pay = new NextRequest('http://localhost/api/delivery/standalone/checkout', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'x' }),
    });
    const booking = new NextRequest('http://localhost/api/delivery/booking-requests', {
      method: 'POST',
      body: JSON.stringify({ deliveryProfileId: 'x' }),
    });
    await expectDisabled(await bookPost(book()));
    await expectDisabled(await bookPost(book()));
    await expectDisabled(await checkoutPost(pay));
    await expectDisabled(await bookingPost(booking));
    await expectDisabled(
      await acceptPost(new NextRequest('http://localhost/api/delivery/booking-requests/abc/accept', { method: 'POST' }), {
        params: { id: 'abc' },
      }),
    );
    process.env.HOMECHEFF_DELIVERY_ENABLED = 'nope';
    await expectDisabled(await bookPost(book()));
    process.env.HOMECHEFF_DELIVERY_ENABLED = 'true';
    await assert.rejects(() => bookPost(book()), /headers/);
    if (previous === undefined) delete process.env.HOMECHEFF_DELIVERY_ENABLED;
    else process.env.HOMECHEFF_DELIVERY_ENABLED = previous;
  });
});

describe('the gate does not wrap existing recovery', () => {
  it('leaves Stripe webhook settlement and campaign qualification ungated', () => {
    const webhook = source('app/api/stripe/webhook/route.ts');
    const products = source('app/api/products/create/route.ts');
    const checkout = source('app/api/checkout/route.ts');
    assert.equal(webhook.includes('isHomeCheffDeliveryEnabled'), false);
    assert.equal(products.includes('isHomeCheffDeliveryEnabled'), false);
    assert.match(checkout, /isLocalProviderMode && !isHomeCheffDeliveryEnabled\(\)/);
    assert.doesNotMatch(checkout, /isParcelShippingMode && !isHomeCheffDeliveryEnabled/);
  });
});
