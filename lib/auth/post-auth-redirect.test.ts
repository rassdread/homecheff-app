import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  needsProfileOnboardingFromFlags,
  pathAfterMinimalProfile,
  resolvePathAfterSocialAuth,
} from './post-auth-redirect';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

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

describe('google login lands on the feed', () => {
  it('sends a new and an existing google user to the feed, including an incomplete profile', () => {
    assert.equal(
      resolvePathAfterSocialAuth({ hasTempUsername: true, onboardingCompleted: false }),
      '/',
    );
    assert.equal(
      resolvePathAfterSocialAuth({ hasTempUsername: false, onboardingCompleted: true }),
      '/',
    );
    assert.equal(
      needsProfileOnboardingFromFlags({ hasTempUsername: true, onboardingCompleted: false }),
      true,
    );
  });

  it('does not leave the login page or the soft-auth dialog in front of a session', () => {
    const login = readFileSync(join(root, 'app/login/page.tsx'), 'utf8');
    assert.match(login, /deliveryRegistrationReturnFromCallback/);
    assert.doesNotMatch(login, /!affiliateReturn/);
    assert.match(login, /sessionStatus === 'authenticated'/);
    const soft = readFileSync(join(root, 'components/auth/SoftAuthGateHost.tsx'), 'utf8');
    assert.match(soft, /status === 'authenticated'/);
    assert.match(soft, /setOpen\(false\)/);
    const social = readFileSync(join(root, 'components/auth/SocialLoginRedirect.tsx'), 'utf8');
    assert.doesNotMatch(social, /complete-profile/);
  });
});
