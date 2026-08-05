#!/usr/bin/env npx tsx
/**
 * Google native sign-in configuration validators (deterministic).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  publicNativeGoogleClientIdUsesStaticEnvAccess,
  resolveNativeGoogleAudiences,
  resolvePublicNativeGoogleClientId,
} from '../lib/auth/google-oauth-clients';
import {
  googleNativeConfigBlockedUserMessage,
  mapNativeGoogleApiErrorForUser,
  shouldShowGoogleNativeDevHint,
} from '../lib/auth/google-login-user-messages';
import { shouldUseNativeGoogleLogin } from '../lib/native/subscribeNativeShell';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '../lib/auth/session-cookie-name';

let n = 0;
function ok(label: string) {
  n += 1;
  console.log(`  ✅ ${label}`);
}

console.log('=== Google native sign-in validators ===\n');

const oauthSrc = readFileSync(
  join(process.cwd(), 'lib/auth/google-oauth-clients.ts'),
  'utf8',
);
assert.equal(publicNativeGoogleClientIdUsesStaticEnvAccess(oauthSrc), true);
ok('static NEXT_PUBLIC access for Capgo client id');

assert.equal(
  shouldUseNativeGoogleLogin({ androidBridge: true, nativeAndroid: false }),
  true,
);
assert.equal(
  shouldUseNativeGoogleLogin({ androidBridge: false, nativeAndroid: true }),
  true,
);
assert.equal(
  shouldUseNativeGoogleLogin({ androidBridge: false, nativeAndroid: false }),
  false,
);
ok('web-vs-native flow selection');

delete process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID;
delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_NATIVE_CLIENT_ID;
assert.equal(resolvePublicNativeGoogleClientId(), '');
assert.equal(resolveNativeGoogleAudiences().audiences.length, 0);
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'legacy-native.apps.googleusercontent.com';
assert.equal(
  resolvePublicNativeGoogleClientId(),
  'legacy-native.apps.googleusercontent.com',
);
process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID =
  'preferred-native.apps.googleusercontent.com';
assert.equal(
  resolvePublicNativeGoogleClientId(),
  'preferred-native.apps.googleusercontent.com',
);
ok('legacy + preferred public native client resolution');

const nl = googleNativeConfigBlockedUserMessage('nl');
const en = googleNativeConfigBlockedUserMessage('en');
assert.match(nl, /browser|e-mail|email/i);
assert.equal(/NEXT_PUBLIC_|GOOGLE_/.test(nl), false);
assert.equal(/NEXT_PUBLIC_|GOOGLE_/.test(en), false);
assert.equal(
  /NEXT_PUBLIC_/.test(
    mapNativeGoogleApiErrorForUser('google_native_not_configured', 'nl'),
  ),
  false,
);
ok('production UX suppresses env var names');

assert.equal(typeof shouldShowGoogleNativeDevHint(), 'boolean');
ok('dev hint gate exists');

assert.equal(NEXTAUTH_SESSION_COOKIE_NAME, 'next-auth.session-token');
const nativeSession = readFileSync(
  join(process.cwd(), 'lib/auth/native-google-session.ts'),
  'utf8',
);
assert.match(nativeSession, /NEXTAUTH_SESSION_COOKIE_NAME/);
ok('native session cookie aligns with NextAuth cookie name');

const button = readFileSync(
  join(process.cwd(), 'components/auth/NativeGoogleSignInButton.tsx'),
  'utf8',
);
assert.doesNotMatch(
  button,
  /Google login in de app vereist NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID/,
);
assert.match(button, /openSystemBrowserGoogleOAuth/);
ok('native button uses system-browser fallback; no raw env warning');

console.log(`\n${n} checks passed.`);
