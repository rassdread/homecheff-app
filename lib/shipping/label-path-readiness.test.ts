import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  shippingCheckoutShouldHardBlock,
  shippingLabelsCertified,
} from './label-path-readiness';

describe('shipping label path readiness', () => {
  it('defaults to not certified and not hard-blocking', () => {
    assert.equal(shippingLabelsCertified({}), false);
    assert.equal(shippingCheckoutShouldHardBlock({}), false);
  });

  it('hard-blocks only when explicitly required and not certified', () => {
    assert.equal(
      shippingCheckoutShouldHardBlock({
        SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'true',
      }),
      true,
    );
    assert.equal(
      shippingCheckoutShouldHardBlock({
        SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH: 'true',
        SHIPPING_LABELS_CERTIFIED: 'true',
      }),
      false,
    );
  });
});
