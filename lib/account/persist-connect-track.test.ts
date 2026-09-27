import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { decideConnectTrackPersist } from './persist-connect-track';

describe('persist connect track', () => {
  it('stores particular or business for an adult without creating Stripe', () => {
    const particular = decideConnectTrackPersist({
      requested: 'PARTICULAR',
      ageMode: 'ADULT',
      hasStripeAccount: false,
      existingTrack: null,
    });
    const business = decideConnectTrackPersist({
      requested: 'BUSINESS',
      ageMode: 'ADULT',
      hasStripeAccount: false,
      existingTrack: null,
    });
    assert.equal(particular.ok && particular.track, 'PARTICULAR');
    assert.equal(business.ok && business.track, 'BUSINESS');
  });

  it('refuses business before age is known and for a minor', () => {
    for (const ageMode of ['MINOR', 'DOB_REQUIRED'] as const) {
      const decision = decideConnectTrackPersist({
        requested: 'BUSINESS',
        ageMode,
        hasStripeAccount: false,
        existingTrack: null,
      });
      assert.equal(decision.ok, false);
      if (!decision.ok) assert.equal(decision.code, 'BUSINESS_18_PLUS');
    }
  });

  it('allows particular for a minor and does not switch an existing account', () => {
    const minor = decideConnectTrackPersist({
      requested: 'PARTICULAR',
      ageMode: 'MINOR',
      hasStripeAccount: false,
      existingTrack: null,
    });
    assert.equal(minor.ok && minor.track, 'PARTICULAR');
    const locked = decideConnectTrackPersist({
      requested: 'BUSINESS',
      ageMode: 'ADULT',
      hasStripeAccount: true,
      existingTrack: 'PARTICULAR',
    });
    assert.equal(locked.ok, false);
    if (!locked.ok) assert.equal(locked.code, 'TRACK_LOCKED');
  });

  it('updates only the signed-in user and does not mark Stripe ready', () => {
    const route = readFileSync(
      new URL('../../app/api/stripe/connect/track/route.ts', import.meta.url),
      'utf8',
    );
    assert.match(route, /sessionUser\.id/);
    assert.doesNotMatch(route, /body\.userId|stripeConnectOnboardingCompleted|stripe\.accounts\.create/);
  });
});

describe('listing form reuses the shared completion panel', () => {
  it('saves the listing draft before Stripe and keeps direct contact', () => {
    const form = readFileSync(
      new URL('../../components/products/marketplace/MarketplaceOfferForm.tsx', import.meta.url),
      'utf8',
    );
    const guidance = readFileSync(
      new URL('../../components/products/marketplace/SettlementConnectGuidance.tsx', import.meta.url),
      'utf8',
    );
    const panel = readFileSync(
      new URL('../../components/account/AccountCompletionPanel.tsx', import.meta.url),
      'utf8',
    );
    assert.match(form, /acceptDirectContact/);
    assert.match(form, /onBeforeStripe/);
    assert.match(form, /persistItemDraft/);
    assert.match(guidance, /variant="listing"/);
    assert.match(panel, /\/api\/account\/date-of-birth/);
    assert.match(panel, /\/api\/account\/parental-consent/);
    assert.match(panel, /\/api\/stripe\/connect\/track/);
    assert.match(panel, /\/api\/stripe\/connect\/onboard/);
    assert.doesNotMatch(panel, /listing\.dateOfBirth|listing\.sellerType/);
  });
});
