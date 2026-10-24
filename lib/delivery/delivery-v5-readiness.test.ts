import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { observeStripeProcessingFee } from './stripe-fee-observation';
import { boundedOpsLimit, classifyDeliveryOperations, opsCursor } from './delivery-operations-status';
import { getBatchRouteDistances, getRouteDistance, isVerifiedRoadDistance } from '@/lib/google-maps-distance';

describe('stripe processing fee observation', () => {
  it('keeps a pending balance-transaction fee out of realized profit', () => {
    const pending = observeStripeProcessingFee({ fee: 72, status: 'pending' });
    assert.equal(pending.feeCents, 72);
    assert.equal(pending.feeSource, 'stripe_balance_transaction');
    assert.equal(pending.stripeFeeFinal, false);
    const available = observeStripeProcessingFee({ fee: 72, status: 'available' });
    assert.equal(available.stripeFeeFinal, true);
    assert.equal(observeStripeProcessingFee(null).feeCents, null);
    assert.equal(observeStripeProcessingFee({ fee: 47, status: 'unknown' }).feeSource, 'unavailable');
  });
});

describe('delivery operations status', () => {
  it('bounds pages and classifies failures without a payload', () => {
    assert.equal(boundedOpsLimit('500'), 50);
    assert.equal(boundedOpsLimit('nope'), 25);
    assert.equal(opsCursor('evt_abc'), 'evt_abc');
    assert.equal(opsCursor('payload'), null);
    assert.deepEqual(
      classifyDeliveryOperations({
        failedRepeated: 2,
        processingStale: 0,
        rejected: 1,
        payoutsMissingTransfer: 1,
        mapsRuntime: 'production',
        mapsPayable: false,
      }),
      ['WEBHOOK_FAILED_REPEATED', 'WEBHOOK_REJECTED', 'PAYOUT_MISSING_TRANSFER', 'MAPS_PRODUCTION_NOT_READY'],
    );
    assert.deepEqual(
      classifyDeliveryOperations({
        failedRepeated: 0,
        processingStale: 0,
        rejected: 0,
        payoutsMissingTransfer: 0,
        mapsRuntime: 'non_production',
        mapsPayable: false,
        receiptStoreReady: false,
      }),
      ['WEBHOOK_RECEIPT_STORE_UNAVAILABLE'],
    );
  });
});

describe('production distance matrix configuration', () => {
  it('does not call Google or substitute haversine when production is not configured', async () => {
    let called = false;
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      GOOGLE_MAPS_API_KEY: 'preview-key',
      GOOGLE_MAPS_KEY_ROLE: 'preview',
    };
    const result = await getRouteDistance(
      { lat: 51.9, lng: 4.4 },
      { lat: 52.0, lng: 4.3 },
      'driving',
      {
        env,
        fetchImpl: async () => {
          called = true;
          throw new Error('should not call');
        },
      },
    );
    assert.equal(called, false);
    assert.equal(isVerifiedRoadDistance(result), false);
    if ('error' in result) assert.equal(result.error, 'PRODUCTION_ROLE_REQUIRED');
  });

  it('does not accept an explicit key or a batch haversine result in an unready production runtime', async () => {
    let called = false;
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      GOOGLE_MAPS_API_KEY: 'preview-key',
      GOOGLE_MAPS_KEY_ROLE: 'preview',
    };
    const single = await getRouteDistance(
      { lat: 51.9, lng: 4.4 },
      { lat: 52.0, lng: 4.3 },
      'driving',
      {
        env,
        apiKey: 'caller-supplied-key',
        fetchImpl: async () => {
          called = true;
          throw new Error('should not call');
        },
      },
    );
    const batch = await getBatchRouteDistances(
      { lat: 51.9, lng: 4.4 },
      [{ lat: 52.0, lng: 4.3 }],
      'driving',
      {
        env,
        fetchImpl: async () => {
          called = true;
          throw new Error('should not call');
        },
      },
    );
    assert.equal(called, false);
    assert.equal(isVerifiedRoadDistance(single), false);
    assert.equal(isVerifiedRoadDistance(batch[0]), false);
  });
});
