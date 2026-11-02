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
  it('defaults to not certified and hard-blocks public parcel checkout', () => {
    assert.equal(shippingLabelsCertified(env({})), false);
    assert.equal(shippingCheckoutShouldHardBlock(env({})), true);
  });

  it('stays blocked until labels are certified, unless the owner explicitly opens checkout', () => {
    assert.equal(
      shippingCheckoutShouldHardBlock(
        env({ SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'true' }),
      ),
      true,
    );
    assert.equal(
      shippingCheckoutShouldHardBlock(
        env({ SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'false' }),
      ),
      false,
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
