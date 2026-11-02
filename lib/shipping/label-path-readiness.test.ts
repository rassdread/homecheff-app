import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  shippingCheckoutShouldHardBlock,
  shippingLabelsCertified,
} from './label-path-readiness';

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as NodeJS.ProcessEnv;
}

describe('shipping label path readiness', () => {
  it('defaults to not certified and not hard-blocking', () => {
    assert.equal(shippingLabelsCertified(env({})), false);
    assert.equal(shippingCheckoutShouldHardBlock(env({})), false);
  });

  it('hard-blocks only when explicitly required and not certified', () => {
    assert.equal(
      shippingCheckoutShouldHardBlock(
        env({ SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'true' }),
      ),
      true,
    );
    assert.equal(
      shippingCheckoutShouldHardBlock(
        env({
          SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'true',
          SHIPPING_LABELS_CERTIFIED: 'true',
        }),
      ),
      false,
    );
  });
});
