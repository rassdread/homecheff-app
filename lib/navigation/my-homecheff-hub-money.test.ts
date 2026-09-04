import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/** Mirror of MyHomeCheffHubCard formatEuro — cents → EUR locale string. */
function formatEuro(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/** Bug that produced €11000.00 from 11000 cents. */
function formatEuroFromUnitsBug(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

describe('dashboard money unit safety', () => {
  it('11000 cents formats as €110,00 not €11000.00', () => {
    assert.equal(formatEuroFromUnitsBug(11000), '€11000.00');
    const fixed = formatEuro(11000);
    assert.match(fixed, /110/);
    assert.doesNotMatch(fixed, /11\.?000/);
    assert.ok(fixed.includes('110') || fixed.includes('110,00') || fixed.includes('€\u00a0110'));
  });

  it('does not treat major-unit euros as cents when using formatEuro on euro amounts', () => {
    // If someone passed €111 already-divided, formatEuro would show €1,11 — wrong.
    // Combined earnings path must keep cents; this asserts the contract.
    assert.equal(formatEuro(11100).replace(/\s/g, ''), '€111,00');
  });
});
