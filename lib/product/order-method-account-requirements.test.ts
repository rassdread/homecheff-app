import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveProductPublishState,
  requiresStripeForHomecheffCheckout,
} from '../product/order-method';

describe('publish gate — non-Stripe listings', () => {
  const sellerNoStripe = {
    stripeConnectAccountId: null,
    stripeConnectOnboardingCompleted: false,
  };

  it('cash/direct-only listing publishes without Stripe', () => {
    assert.equal(
      requiresStripeForHomecheffCheckout({
        acceptHomeCheffPayment: false,
        acceptDirectContact: true,
        priceCents: 1500,
      }),
      false,
    );
    const gate = resolveProductPublishState({
      requestedActive: true,
      orderMethod: 'CONTACT',
      priceCents: 1500,
      sellerUser: sellerNoStripe,
    });
    assert.equal(gate.isActive, true);
    assert.equal(gate.publishBlocked, false);
  });

  it('HomeCheff payment without Stripe stays active but flags payments required', () => {
    const gate = resolveProductPublishState({
      requestedActive: true,
      orderMethod: 'HOMECHEFF_PAYMENT',
      priceCents: 1500,
      sellerUser: sellerNoStripe,
    });
    assert.equal(gate.isActive, true);
    assert.equal(gate.publishBlocked, true);
    assert.equal(gate.publishBlockReason, 'PAYMENTS_REQUIRED');
  });

  it('zero-price / contact-style HomeCheff does not require Stripe', () => {
    assert.equal(
      requiresStripeForHomecheffCheckout({
        acceptHomeCheffPayment: true,
        priceCents: 0,
      }),
      false,
    );
  });
});
