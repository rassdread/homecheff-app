import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isDeliveryCertBuyerUserId,
  isDeliveryCertProviderUserId,
  isProviderVisibleToBuyer,
} from '@/lib/delivery/delivery-cert-scope';

describe('delivery cert scope', () => {
  const steve = 'c54bbbcf-1323-4539-8e30-c2a6b7f95662';
  const sergio = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';
  const stranger = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('marks r.sergio as cert provider and Steve as cert buyer by default', () => {
    assert.equal(isDeliveryCertProviderUserId(sergio), true);
    assert.equal(isDeliveryCertBuyerUserId(steve), true);
    assert.equal(isDeliveryCertProviderUserId(stranger), false);
    assert.equal(isDeliveryCertBuyerUserId(stranger), false);
  });

  it('hides cert provider from normal buyers; allows Steve', () => {
    assert.equal(
      isProviderVisibleToBuyer({ providerUserId: sergio, buyerUserId: steve }),
      true,
    );
    assert.equal(
      isProviderVisibleToBuyer({
        providerUserId: sergio,
        buyerUserId: stranger,
      }),
      false,
    );
    assert.equal(
      isProviderVisibleToBuyer({
        providerUserId: sergio,
        buyerUserId: null,
      }),
      false,
    );
  });

  it('does not restrict non-cert providers', () => {
    assert.equal(
      isProviderVisibleToBuyer({
        providerUserId: stranger,
        buyerUserId: stranger,
      }),
      true,
    );
  });
});
