import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MINIMUM_CHECKOUT_CENTS,
  STRIPE_EUR_CARD_MINIMUM_CENTS,
  CHECKOUT_MINIMUM_NOT_MET,
  evaluateCheckoutFloor,
  computeCheckoutEligibleBaseCents,
  buildAuthoritativeLineItems,
  resolveAuthoritativeUnitPriceCents,
} from './checkout-floor';
import { calculateStripeFeeForBuyer } from '../fees';

describe('marketplace checkout floor', () => {
  const line = (cents: number, qty = 1) => [
    { productId: 'p1', quantity: qty, unitPriceCents: cents },
  ];

  it('aligns the online floor to Stripe EUR card minimum (€0.50)', () => {
    assert.equal(MINIMUM_CHECKOUT_CENTS, 50);
    assert.equal(STRIPE_EUR_CARD_MINIMUM_CENTS, 50);
  });

  it('blocks amounts below the Stripe EUR card minimum', () => {
    for (const cents of [0, 1, 25, 49]) {
      const result = evaluateCheckoutFloor({ lineItems: line(cents), deliveryFeeCents: 0 });
      assert.equal(result.eligible, false, `expected block at ${cents}`);
      assert.equal(result.code, CHECKOUT_MINIMUM_NOT_MET);
      assert.equal(result.minimumCents, MINIMUM_CHECKOUT_CENTS);
      assert.equal(result.eligibleBaseCents, cents);
    }
  });

  it('allows Stripe minimum and above', () => {
    for (const cents of [50, 51, 744, 1000, 1500]) {
      const result = evaluateCheckoutFloor({ lineItems: line(cents), deliveryFeeCents: 0 });
      assert.equal(result.eligible, true, `expected allow at ${cents}`);
      assert.equal(result.code, undefined);
    }
  });

  it('allows the observed Tes pilot total (€4.50 + €2.58 = €7.08 base)', () => {
    const result = evaluateCheckoutFloor({
      lineItems: line(450),
      deliveryFeeCents: 258,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.eligibleBaseCents, 708);
  });

  it('allows full observed checkout math before Stripe surcharge (€7.08)', () => {
    // Buyer-facing €7.44 includes Stripe surcharge; floor uses products+delivery only.
    const base = computeCheckoutEligibleBaseCents({
      productsTotalCents: 450,
      deliveryFeeCents: 258,
    });
    assert.equal(base, 708);
    const { buyerTotalCents } = calculateStripeFeeForBuyer(base);
    assert.equal(buyerTotalCents, 744);
    assert.equal(evaluateCheckoutFloor({ lineItems: line(450), deliveryFeeCents: 258 }).eligible, true);
  });

  it('counts delivery toward floor', () => {
    const result = evaluateCheckoutFloor({
      lineItems: line(25),
      deliveryFeeCents: 25,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.eligibleBaseCents, 50);
  });

  it('€0.49 product + €0 delivery fails at Stripe boundary', () => {
    assert.equal(
      evaluateCheckoutFloor({ lineItems: line(49), deliveryFeeCents: 0 }).eligible,
      false,
    );
    assert.equal(
      evaluateCheckoutFloor({ lineItems: line(50), deliveryFeeCents: 0 }).eligible,
      true,
    );
  });

  it('SMS add-on does not satisfy floor', () => {
    const result = evaluateCheckoutFloor({
      lineItems: line(25),
      deliveryFeeCents: 0,
      smsNotificationCostCents: 300,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.eligibleBaseCents, 25);
  });

  it('multi-item cart sums correctly', () => {
    const result = evaluateCheckoutFloor({
      lineItems: [{ productId: 'a', quantity: 2, unitPriceCents: 25 }],
      deliveryFeeCents: 0,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.eligibleBaseCents, 50);
  });

  it('stripe surcharge must not make sub-minimum base eligible', () => {
    const base = computeCheckoutEligibleBaseCents({ productsTotalCents: 40, deliveryFeeCents: 0 });
    assert.equal(base, 40);
    const { buyerTotalCents } = calculateStripeFeeForBuyer(base + 6);
    assert.ok(buyerTotalCents > MINIMUM_CHECKOUT_CENTS);
    const floor = evaluateCheckoutFloor({
      lineItems: line(40),
      deliveryFeeCents: 0,
      smsNotificationCostCents: 6,
    });
    assert.equal(floor.eligible, false);
  });

  it('uses DB listing price for standard cart (not manipulated client price)', () => {
    const items = buildAuthoritativeLineItems(
      [{ productId: 'p1', quantity: 1, priceCents: 50 }],
      [{ id: 'p1', priceCents: 1500 }],
    );
    assert.equal(items[0].unitPriceCents, 1500);
    assert.equal(
      evaluateCheckoutFloor({ lineItems: items, deliveryFeeCents: 0 }).eligible,
      true,
    );
  });

  it('uses validated deal price for community order checkout', () => {
    const unit = resolveAuthoritativeUnitPriceCents(
      { id: 'p1', priceCents: 0 },
      1200,
      { communityOrderValidated: true },
    );
    assert.equal(unit, 1200);
  });
});
