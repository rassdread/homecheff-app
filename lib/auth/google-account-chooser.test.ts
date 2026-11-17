import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { GOOGLE_ACCOUNT_CHOOSER_PARAMS } from './google-account-chooser';
import { buildSocialSuccessCallbackUrl } from './post-auth-redirect';

test('a Google click asks Google to show the account chooser', () => {
  assert.equal(GOOGLE_ACCOUNT_CHOOSER_PARAMS.prompt, 'select_account');
  const auth = readFileSync('lib/auth.ts', 'utf8');
  assert.match(auth, /GOOGLE_ACCOUNT_CHOOSER_PARAMS/);
  const provider = auth.slice(auth.indexOf('GoogleProvider({'), auth.indexOf('profile(profile)'));
  assert.match(provider, /GOOGLE_ACCOUNT_CHOOSER_PARAMS/);

  const login = readFileSync('app/login/page.tsx', 'utf8');
  const register = readFileSync('app/register/page.tsx', 'utf8');
  assert.equal(login.includes('preferGoogleAccountPicker'), false);
  assert.match(login, /provider === "google" \? GOOGLE_ACCOUNT_CHOOSER_PARAMS/);
  assert.match(register, /provider === "google" \? GOOGLE_ACCOUNT_CHOOSER_PARAMS/);
  assert.match(
    readFileSync('components/auth/NativeGoogleSignInButton.tsx', 'utf8'),
    /GOOGLE_ACCOUNT_CHOOSER_PARAMS/,
  );
});

test('the Google return path still points at checkout after the chooser', () => {
  assert.equal(
    buildSocialSuccessCallbackUrl('/checkout'),
    '/auth/social-success?next=%2Fcheckout',
  );
  const login = readFileSync('app/login/page.tsx', 'utf8');
  assert.match(login, /callbackUrl: buildSocialSuccessCallbackUrl\(callbackUrl\)/);
  assert.match(readFileSync('lib/auth.ts', 'utf8'), /signIn: "\/login"/);
});
