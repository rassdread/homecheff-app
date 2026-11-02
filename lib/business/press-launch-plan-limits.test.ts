import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import { buildPromoDurationQuote } from '@/lib/promo-codes/platform-promo-duration';

describe('press-launch plan location limits', () => {
  it('keeps individual and basic at one location', () => {
    assert.equal(getBusinessVisibilityProfile('individual').maxLocations, 1);
    assert.equal(getBusinessVisibilityProfile('basic').maxLocations, 1);
  });

  it('allows Pro three locations and Premium twenty-five', () => {
    assert.equal(getBusinessVisibilityProfile('pro').maxLocations, 3);
    assert.equal(getBusinessVisibilityProfile('premium').maxLocations, 25);
  });
});

describe('VIP26-style free year promo quote', () => {
  it('ends automatically after 12 cycles with END (no paid renewal)', () => {
    const quote = buildPromoDurationQuote(12, 'END');
    assert.equal(quote.discountDurationCycles, 12);
    assert.equal(quote.endsAutomatically, true);
    assert.equal(quote.resumesAtListPrice, false);
    assert.equal(quote.postPromotionAction, 'END');
  });

  it('does not auto-renew when CONTINUE is chosen (paid resume is explicit)', () => {
    const quote = buildPromoDurationQuote(12, 'CONTINUE');
    assert.equal(quote.resumesAtListPrice, true);
    assert.equal(quote.endsAutomatically, false);
  });
});
