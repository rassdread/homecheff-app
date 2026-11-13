import assert from 'node:assert/strict';
import test from 'node:test';
import { knownCheckoutDeliveryFeeCents } from './known-delivery-fee';

test('a missing marketplace quote is not free delivery', () => {
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'local_provider',
      addressValidated: true,
      quote: null,
    }),
    null,
  );
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'local_provider',
      addressValidated: true,
      quote: { deliveryFeeCents: 0, withinFreeRadius: false },
    }),
    null,
  );
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'local_provider',
      addressValidated: false,
      quote: { deliveryFeeCents: 1750, withinFreeRadius: false },
    }),
    null,
  );
});

test('a provider quote and an intentional free radius stay distinct', () => {
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'local_provider',
      addressValidated: true,
      quote: { deliveryFeeCents: 1750, withinFreeRadius: false },
    }),
    1750,
  );
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'local_provider',
      addressValidated: true,
      quote: { deliveryFeeCents: 0, withinFreeRadius: true },
    }),
    0,
  );
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'shipping',
      addressValidated: true,
      quote: { deliveryFeeCents: 0, shippingMethodId: 'postnl' },
    }),
    0,
  );
  assert.equal(
    knownCheckoutDeliveryFeeCents({
      selectedDelivery: 'pickup',
      addressValidated: false,
      quote: null,
      optionPrice: 0,
    }),
    0,
  );
});
