import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readPlatformTransferBalance } from './platform-transfer-balance';

describe('platform transfer balance', () => {
  it('reports a successful EUR payments balance', async () => {
    const result = await readPlatformTransferBalance({
      balance: {
        retrieve: async () => ({
          livemode: false,
          available: [{ amount: 50000, currency: 'eur' }],
          pending: [{ amount: 10000, currency: 'eur' }],
        }),
      },
    });
    assert.equal(result.known, true);
    assert.equal(result.availableCents, 50000);
    assert.equal(result.pendingCents, 10000);
    assert.equal(result.livemode, false);
  });

  it('does not turn a Stripe failure or a missing client into zero', async () => {
    const failed = await readPlatformTransferBalance({
      balance: {
        retrieve: async () => {
          throw new Error('stripe down');
        },
      },
    });
    const missing = await readPlatformTransferBalance(null);
    assert.equal(failed.known, false);
    assert.equal(failed.availableCents, null);
    assert.equal(missing.availableCents, null);
  });
});
