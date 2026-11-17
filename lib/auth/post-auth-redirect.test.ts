import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  completeProfileDestination,
  needsProfileOnboardingFromFlags,
  pathAfterMinimalProfile,
  resolvePathAfterSocialAuth,
} from './post-auth-redirect';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';

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

describe('open terms stay on #voorwaarden', () => {
  const finished = { needsOnboarding: false, hash: '#voorwaarden' };

  it('keeps a finished profile with open terms on the section, including a fresh visit', () => {
    assert.equal(
      completeProfileDestination({ ...finished, termsAccepted: false }),
      null,
    );
    assert.equal(
      completeProfileDestination({ ...finished, termsAccepted: false, intentUrl: '/sell/new' }),
      null,
    );
  });

  it('still redirects someone who already accepted the terms', () => {
    assert.equal(
      completeProfileDestination({ ...finished, termsAccepted: true }),
      '/',
    );
    assert.equal(
      completeProfileDestination({
        ...finished,
        termsAccepted: true,
        intentUrl: '/messages',
      }),
      '/messages',
    );
  });

  it('does not accept terms while deciding to stay', () => {
    const page = readFileSync(join(root, 'app/onboarding/complete-profile/page.tsx'), 'utf8');
    assert.match(page, /completeProfileDestination\(/);
    assert.match(page, /window\.location\.hash !== '#voorwaarden'/);
    assert.match(page, /id="voorwaarden"/);
    assert.doesNotMatch(
      page.slice(0, page.indexOf('handleSubmit')),
      /acceptTerms:\s*true/,
    );
  });
});

describe('courier date of birth stays the submitted date', () => {
  it('stores the submitted birth date instead of a separately typed age', () => {
    const parsed = parseAndValidateDeliverySignupFields(
      {
        age: 40,
        dateOfBirth: '1992-04-03',
        transportation: ['BIKE'],
        preferredRadius: 8,
        maxDistance: 15,
        acceptDeliveryAgreement: true,
      },
      { requireAccountFields: false },
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.dateOfBirth?.toISOString().slice(0, 10), '1992-04-03');
    assert.notEqual(parsed.data.age, 40);
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
