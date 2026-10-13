import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { personalReferralHandoff } from './personal-referral-redirect';

describe('personal referral and campaign UTMs', () => {
  it('keeps the affiliate code and the Meta campaign on the same visit', () => {
    const handoff = personalReferralHandoff(
      'https://homecheff.eu/onboarding/seller?ref=KEEPME&utm_source=meta&utm_medium=paid_social&utm_campaign=homecheff_launch&utm_content=ad_a&utm_term=seller',
    );
    assert.ok(handoff);
    assert.equal(handoff.code, 'KEEPME');
    assert.equal(handoff.landingPath.includes('ref='), false);
    const landing = new URL(handoff.landingPath, 'https://homecheff.eu');
    assert.equal(landing.searchParams.get('utm_source'), 'meta');
    assert.equal(landing.searchParams.get('utm_medium'), 'paid_social');
    assert.equal(landing.searchParams.get('utm_campaign'), 'homecheff_launch');
    assert.equal(landing.searchParams.get('utm_content'), 'ad_a');
    assert.equal(landing.searchParams.get('utm_term'), 'seller');
    const api = new URL(handoff.apiUrl);
    assert.equal(api.searchParams.get('code'), 'KEEPME');
    const redirected = new URL(api.searchParams.get('redirect') || '/', 'https://homecheff.eu');
    assert.equal(redirected.searchParams.get('utm_campaign'), 'homecheff_launch');
    assert.equal(redirected.searchParams.get('ref'), null);
  });

  it('does nothing when there is no affiliate code', () => {
    assert.equal(
      personalReferralHandoff('https://homecheff.eu/onboarding/seller?utm_source=meta'),
      null,
    );
  });
});
