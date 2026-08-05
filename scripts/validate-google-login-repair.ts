#!/usr/bin/env npx tsx
/**
 * Focused Google login repair validators (deterministic — no live Google OAuth).
 */
import assert from 'node:assert/strict';
import {
  buildSocialSuccessCallbackUrl,
  sanitizePostAuthRelativeUrl,
} from '../lib/auth/post-auth-redirect';
import {
  isGoogleWebOAuthConfigured,
  resolveGoogleWebOAuthClient,
} from '../lib/auth/google-oauth-clients';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '../lib/auth/session-cookie-name';
import {
  getAuthSessionCookieDomain,
  getCanonicalAuthOrigin,
  resolveSafeAuthRedirect,
  PRODUCTION_AUTH_ORIGIN,
} from '../lib/auth-origin';

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void,
): void {
  const prev: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    prev[key] = process.env[key];
    const val = vars[key];
    if (val === undefined) delete process.env[key];
    else process.env[key] = val;
  }
  try {
    fn();
  } finally {
    for (const [key, val] of Object.entries(prev)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  }
}

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✅ ${label}`);
}

console.log('=== Google login repair validators ===\n');

assert.equal(NEXTAUTH_SESSION_COOKIE_NAME, 'next-auth.session-token');
ok('session cookie name SSOT');

assert.equal(sanitizePostAuthRelativeUrl('https://evil.example/phish'), null);
assert.equal(sanitizePostAuthRelativeUrl('//evil.example'), null);
assert.equal(sanitizePostAuthRelativeUrl('/login'), null);
assert.equal(sanitizePostAuthRelativeUrl('/auth/social-success'), null);
assert.equal(sanitizePostAuthRelativeUrl('/messages?x=1'), '/messages?x=1');
ok('sanitizePostAuthRelativeUrl open-redirect + auth-loop denial');

assert.equal(buildSocialSuccessCallbackUrl(null), '/auth/social-success');
assert.equal(buildSocialSuccessCallbackUrl('/'), '/auth/social-success');
assert.equal(
  buildSocialSuccessCallbackUrl('/messages'),
  '/auth/social-success?next=%2Fmessages',
);
assert.equal(
  buildSocialSuccessCallbackUrl('https://evil.example'),
  '/auth/social-success',
);
ok('buildSocialSuccessCallbackUrl preserves safe next only');

withEnv(
  {
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    GOOGLE_WEB_CLIENT_ID: undefined,
    GOOGLE_WEB_CLIENT_SECRET: undefined,
  },
  () => {
    assert.equal(resolveGoogleWebOAuthClient(), null);
    assert.equal(isGoogleWebOAuthConfigured(), false);
  },
);
ok('Google web client absent when envs missing');

withEnv(
  {
    GOOGLE_CLIENT_ID: '615612462371-legacy.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'legacy-secret',
    GOOGLE_WEB_CLIENT_ID: undefined,
    GOOGLE_WEB_CLIENT_SECRET: undefined,
  },
  () => {
    const c = resolveGoogleWebOAuthClient();
    assert.ok(c);
    assert.equal(c!.source.clientId, 'GOOGLE_CLIENT_ID');
    assert.equal(c!.source.clientSecret, 'GOOGLE_CLIENT_SECRET');
  },
);
ok('legacy GOOGLE_CLIENT_* resolution');

withEnv(
  {
    GOOGLE_CLIENT_ID: '615612462371-legacy.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'legacy-secret',
    GOOGLE_WEB_CLIENT_ID: '615612462371-web.apps.googleusercontent.com',
    GOOGLE_WEB_CLIENT_SECRET: 'web-secret',
  },
  () => {
    const c = resolveGoogleWebOAuthClient();
    assert.ok(c);
    assert.equal(c!.source.clientId, 'GOOGLE_WEB_CLIENT_ID');
    assert.equal(c!.clientId.includes('web'), true);
  },
);
ok('preferred GOOGLE_WEB_* overrides legacy');

withEnv(
  {
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
  },
  () => {
    assert.equal(getCanonicalAuthOrigin(), PRODUCTION_AUTH_ORIGIN);
    assert.equal(getAuthSessionCookieDomain(), '.homecheff.eu');
    assert.equal(
      resolveSafeAuthRedirect('https://evil.example/x', 'https://homecheff.eu'),
      'https://homecheff.eu/',
    );
    assert.equal(
      resolveSafeAuthRedirect('/auth/social-success', 'https://homecheff.eu'),
      'https://homecheff.eu/auth/social-success',
    );
  },
);
ok('production canonical origin + safe redirect');

withEnv(
  {
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
    VERCEL_URL: 'homecheff-app-git-fix-abc-sergio-s-projects-f7b64ee1.vercel.app',
  },
  () => {
    const preview =
      'https://homecheff-app-git-fix-abc-sergio-s-projects-f7b64ee1.vercel.app';
    assert.equal(getCanonicalAuthOrigin(preview), preview);
    assert.equal(getAuthSessionCookieDomain(), undefined);
  },
);
ok('preview host-only cookies + ignores production NEXTAUTH_URL');

console.log(`\n${passed} checks passed.`);
