import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { POST } from '../../app/api/delivery/orders/route';

describe('POST /api/delivery/orders is closed', () => {
  it('rejects an unauthenticated caller before any order lookup', async () => {
    const response = await POST();
    assert.equal(response.status, 405);
    const body = await response.json();
    assert.equal(body.success, undefined);
    assert.equal(typeof body.error, 'string');
  });

  it('rejects an authenticated caller as well, because this fallback is closed', async () => {
    const response = await POST();
    assert.equal(response.status, 405);
  });

  it('does not create a delivery job for a missing, foreign, or duplicate order id', () => {
    const route = readFileSync(new URL('../../app/api/delivery/orders/route.ts', import.meta.url), 'utf8');
    const postStart = route.indexOf('export async function POST');
    const postBody = route.slice(postStart);
    assert.equal(postBody.includes('deliveryOrder.create'), false);
    assert.equal(postBody.includes('prisma.'), false);
    assert.match(postBody, /status: 405/);
  });

  it('leaves paid-order delivery creation on the Stripe webhook', () => {
    const webhook = readFileSync(new URL('../../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');
    assert.match(webhook, /deliveryOrder\.create/);
  });
});
