import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathAfterMinimalProfile } from './post-auth-redirect';

describe('path after the required profile gate', () => {
  it('opens the marketplace when the user has no saved task', () => {
    assert.equal(pathAfterMinimalProfile(null), '/');
    assert.equal(pathAfterMinimalProfile(''), '/');
    assert.equal(pathAfterMinimalProfile('   '), '/');
  });

  it('does not continue into the seller contact and payout wizard', () => {
    assert.notEqual(pathAfterMinimalProfile(null), '/onboarding/interests?profile_gate=done');
  });

  it('keeps a stored in-app task', () => {
    assert.equal(pathAfterMinimalProfile('/sell/new?category=CHEFF'), '/sell/new?category=CHEFF');
    assert.equal(
      pathAfterMinimalProfile('/sell/new?intent=OFFER&marketplaceCategory=PRACTICAL_SERVICE'),
      '/sell/new?intent=OFFER&marketplaceCategory=PRACTICAL_SERVICE',
    );
    assert.equal(pathAfterMinimalProfile('/messages?conversation=abc'), '/messages?conversation=abc');
  });

  it('rejects an external redirect', () => {
    assert.equal(pathAfterMinimalProfile('https://example.com'), '/');
    assert.equal(pathAfterMinimalProfile('//evil.example'), '/');
  });
});
