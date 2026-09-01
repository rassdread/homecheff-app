import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MINIMUM_CHECKOUT_CENTS,
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

  it('blocks sub-€10 product-only orders', () => {
    for (const cents of [250, 500, 750, 999]) {
      const result = evaluateCheckoutFloor({ lineItems: line(cents), deliveryFeeCents: 0 });
      assert.equal(result.eligible, false, `expected block at ${cents}`);
      assert.equal(result.code, CHECKOUT_MINIMUM_NOT_MET);
      assert.equal(result.minimumCents, MINIMUM_CHECKOUT_CENTS);
      assert.equal(result.eligibleBaseCents, cents);
    }
  });

  it('allows €10.00 and above', () => {
    for (const cents of [1000, 1001, 1500]) {
      const result = evaluateCheckoutFloor({ lineItems: line(cents), deliveryFeeCents: 0 });
      assert.equal(result.eligible, true, `expected allow at ${cents}`);
      assert.equal(result.code, undefined);
    }
  });

  it('counts delivery toward floor (€7 + €3 = eligible)', () => {
    const result = evaluateCheckoutFloor({
      lineItems: line(700),
      deliveryFeeCents: 300,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.eligibleBaseCents, 1000);
  });

  it('€9 product + €4 delivery passes; €9 + €0.99 delivery fails', () => {
    assert.equal(
      evaluateCheckoutFloor({ lineItems: line(900), deliveryFeeCents: 400 }).eligible,
      true,
    );
    assert.equal(
      evaluateCheckoutFloor({ lineItems: line(900), deliveryFeeCents: 99 }).eligible,
      false,
    );
  });

  it('SMS add-on does not satisfy floor', () => {
    const result = evaluateCheckoutFloor({
      lineItems: line(750),
      deliveryFeeCents: 0,
      smsNotificationCostCents: 300,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.eligibleBaseCents, 750);
  });

  it('multi-item cart sums correctly (2 × €5)', () => {
    const result = evaluateCheckoutFloor({
      lineItems: [{ productId: 'a', quantity: 2, unitPriceCents: 500 }],
      deliveryFeeCents: 0,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.eligibleBaseCents, 1000);
  });

  it('stripe surcharge must not make sub-€10 base eligible', () => {
    const base = computeCheckoutEligibleBaseCents({ productsTotalCents: 980, deliveryFeeCents: 0 });
    assert.equal(base, 980);
    const { buyerTotalCents } = calculateStripeFeeForBuyer(base + 6); // simulate SMS not in base
    assert.ok(buyerTotalCents > 1000);
    const floor = evaluateCheckoutFloor({
      lineItems: line(980),
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
