import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  affiliateContinueAfterAuth,
  buildVerifyEmailPath,
  isPersonalAffiliateJoinReturn,
  resolveAffiliateSignupRedirect,
} from '@/lib/affiliate/signup-flow';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('affiliate signup return paths', () => {
  it('recognises only the personal affiliate join path', () => {
    assert.equal(isPersonalAffiliateJoinReturn('/affiliate'), true);
    assert.equal(isPersonalAffiliateJoinReturn('/affiliate?welcome=true'), true);
    assert.equal(isPersonalAffiliateJoinReturn('/affiliate/company'), false);
    assert.equal(isPersonalAffiliateJoinReturn('/affiliate/dashboard'), false);
    assert.equal(isPersonalAffiliateJoinReturn('https://evil.example/affiliate'), false);
    assert.equal(isPersonalAffiliateJoinReturn('//evil.example/affiliate'), false);
  });

  it('keeps verification continue inside the app', () => {
    const href = buildVerifyEmailPath('a@example.com', '/affiliate/dashboard');
    assert.match(href, /^\/verify-email\?/);
    assert.match(href, /next=%2Faffiliate%2Fdashboard/);
    const blocked = buildVerifyEmailPath('a@example.com', 'https://evil.example/phish');
    assert.match(blocked, /next=%2Faffiliate%2Fdashboard/);
    assert.doesNotMatch(blocked, /evil\.example/);
  });

  it('sends a new affiliate to the dashboard only after explicit activation', () => {
    assert.equal(
      affiliateContinueAfterAuth({
        returnPath: '/affiliate',
        affiliateActivated: true,
      }),
      '/affiliate/dashboard',
    );
    assert.equal(
      affiliateContinueAfterAuth({
        returnPath: '/affiliate',
        affiliateActivated: false,
      }),
      '/affiliate#affiliate-signup',
    );
    assert.equal(
      affiliateContinueAfterAuth({
        returnPath: '/',
        affiliateActivated: true,
      }),
      null,
    );
  });

  it('does not let a stored join intent override an activated affiliate', () => {
    const href = resolveAffiliateSignupRedirect({
      returnPath: '/affiliate',
      affiliateActivated: true,
      needsVerification: true,
      email: 'a@example.com',
      consumedIntentUrl: '/affiliate',
      fallbackUrl: '/',
    });
    assert.match(href, /^\/verify-email\?/);
    assert.match(href, /next=%2Faffiliate%2Fdashboard/);
    assert.equal(
      resolveAffiliateSignupRedirect({
        returnPath: '/affiliate',
        affiliateActivated: false,
        needsVerification: true,
        email: 'a@example.com',
        consumedIntentUrl: '/affiliate',
        fallbackUrl: '/',
      }),
      '/affiliate#affiliate-signup',
    );
    assert.equal(
      resolveAffiliateSignupRedirect({
        returnPath: '/verkopen',
        affiliateActivated: false,
        needsVerification: false,
        email: 'a@example.com',
        consumedIntentUrl: '/verkopen',
        fallbackUrl: '/',
      }),
      '/verkopen',
    );
  });
});

describe('affiliate signup production codepath', () => {
  it('does not leave the register continue button inert on validation', () => {
    const src = read('app/register/page.tsx');
    assert.match(src, /type="submit"/);
    assert.match(src, /disabled=\{isSubmitting\}/);
    assert.doesNotMatch(
      src,
      /disabled=\{[\s\S]{0,400}usernameValidation\.isValid/,
    );
    assert.match(src, /acceptAffiliateAgreement/);
    assert.match(src, /focusField\(/);
    assert.match(src, /registrationRedirectingRef/);
    assert.match(src, /hc_affiliate_signup_owns_redirect/);
    assert.match(src, /affiliateReturn[\s\S]{0,180}\/affiliate\/dashboard/);
    assert.match(src, /clearPendingIntent\(\)/);
  });

  it('explains a blocked affiliate continue instead of disabling the click', () => {
    const landing = read('components/affiliate/AffiliateGrowthLanding.tsx');
    assert.match(landing, /attemptContinue/);
    assert.match(landing, /role="alert"/);
    assert.doesNotMatch(landing, /disabled=\{isSigningUp \|\| !canSubmit\}/);
  });

  it('scopes the delivery-incomplete email hint to delivery signup', () => {
    const src = read('app/api/auth/validate-email/route.ts');
    assert.match(src, /context === 'delivery'/);
    assert.match(src, /incompleteDeliveryOnboarding/);
    const delivery = read('app/delivery/signup/page.tsx');
    assert.match(delivery, /context:\s*'delivery'/);
  });

  it('preserves affiliate continue through email verification', () => {
    const verify = read('app/verify-email/page.tsx');
    assert.match(verify, /sanitizePostAuthRelativeUrl/);
    const dash = read('app/affiliate/dashboard/page.tsx');
    assert.match(dash, /buildVerifyEmailPath/);
  });

  it('activates an affiliate idempotently without extra roles', () => {
    const src = read('lib/affiliate/activate-affiliate.ts');
    assert.match(src, /P2002/);
    assert.match(src, /status: 'ACTIVE'/);
    assert.doesNotMatch(src, /role:\s*['"]ADMIN['"]/);
    assert.doesNotMatch(src, /SellerProfile/);
    assert.doesNotMatch(src, /DeliveryProfile/);
    assert.doesNotMatch(src, /processAttributionOnSignup/);
    const signup = read('app/api/affiliate/signup/route.ts');
    assert.match(signup, /activatePersonalAffiliate/);
    assert.match(signup, /needsEmailVerification/);
  });
});
