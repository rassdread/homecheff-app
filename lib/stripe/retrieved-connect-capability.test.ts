import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { retrievedConnectCapabilityFields } from '@/lib/stripe/retrieved-connect-capability';

describe('retrieved Connect capability fields', () => {
  it('keeps an explicit false and leaves an absent capability out', () => {
    const stored = retrievedConnectCapabilityFields({
      charges_enabled: false,
      payouts_enabled: true,
      capabilities: {},
    });
    assert.deepEqual(stored, { stripeChargesEnabled: false, stripePayoutsEnabled: true });
    assert.equal('stripeTransfersStatus' in stored, false);
  });

  it('stores an inactive transfer as the retrieved value', () => {
    const stored = retrievedConnectCapabilityFields({
      charges_enabled: true,
      payouts_enabled: false,
      capabilities: { transfers: 'inactive' },
    });
    assert.equal(stored.stripePayoutsEnabled, false);
    assert.equal(stored.stripeTransfersStatus, 'inactive');
  });
});
