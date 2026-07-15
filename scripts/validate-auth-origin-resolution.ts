#!/usr/bin/env npx tsx
/**
 * Validates central auth origin resolution — security + environment matrix.
 */
import assert from 'node:assert/strict';
import {
  getAuthSessionCookieDomain,
  getCanonicalAuthOrigin,
  isHomeCheffProductionOrigin,
  isValidVercelPreviewHostname,
  isValidVercelPreviewOrigin,
  normalizeAuthOrigin,
  resolveAuthDeploymentEnvironment,
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

const PREVIEW_HOST = 'homecheff-app-git-performance-0f5539-sergio-s-projects-f7b64ee1.vercel.app';
const PREVIEW_ORIGIN = `https://${PREVIEW_HOST}`;

console.log('=== Auth origin resolution validator ===\n');

withEnv(
  {
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
  },
  () => {
    assert.equal(resolveAuthDeploymentEnvironment(), 'production');
    assert.equal(getCanonicalAuthOrigin(), PRODUCTION_AUTH_ORIGIN);
    assert.equal(getAuthSessionCookieDomain(), '.homecheff.eu');
    assert.equal(
      resolveSafeAuthRedirect('/login', 'https://homecheff.eu'),
      'https://homecheff.eu/login',
    );
    console.log('  ✅ production + homecheff.eu');
  },
);

withEnv(
  {
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
    VERCEL_URL: PREVIEW_HOST,
  },
  () => {
    assert.equal(resolveAuthDeploymentEnvironment(), 'preview');
    assert.equal(getCanonicalAuthOrigin(PREVIEW_ORIGIN), PREVIEW_ORIGIN);
    assert.equal(getAuthSessionCookieDomain(), undefined);
    assert.equal(
      resolveSafeAuthRedirect('/auth/social-success', PREVIEW_ORIGIN),
      `${PREVIEW_ORIGIN}/auth/social-success`,
    );
    console.log('  ✅ preview + valid vercel.app host');
  },
);

withEnv(
  {
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
    VERCEL_URL: 'evil.vercel.app.attacker.com',
  },
  () => {
    const origin = getCanonicalAuthOrigin('https://evil.vercel.app.attacker.com');
    assert.equal(origin, PRODUCTION_AUTH_ORIGIN, 'invalid preview host must not win');
    console.log('  ✅ preview + invalid vercel lookalike rejected');
  },
);

withEnv(
  {
    VERCEL_ENV: undefined,
    NODE_ENV: 'development',
    NEXTAUTH_URL: 'http://localhost:3000',
  },
  () => {
    assert.equal(resolveAuthDeploymentEnvironment(), 'development');
    assert.equal(getCanonicalAuthOrigin(), 'http://localhost:3000');
    assert.equal(getAuthSessionCookieDomain(), undefined);
    console.log('  ✅ development localhost');
  },
);

assert.equal(isHomeCheffProductionOrigin('https://homecheff.eu'), true);
assert.equal(isHomeCheffProductionOrigin('https://homecheff.eu.attacker.com'), false);
assert.equal(isValidVercelPreviewHostname(PREVIEW_HOST), true);
assert.equal(isValidVercelPreviewHostname('homecheff.eu.attacker.com'), false);
assert.equal(isValidVercelPreviewOrigin(PREVIEW_ORIGIN), true);
assert.equal(normalizeAuthOrigin('https://homecheff.eu/'), 'https://homecheff.eu');
console.log('  ✅ malicious suffix homecheff.eu.attacker.com rejected');

withEnv(
  {
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    PREVIEW_AUTH_URL: PREVIEW_ORIGIN,
    NEXTAUTH_URL: 'https://homecheff.eu',
  },
  () => {
    assert.equal(getCanonicalAuthOrigin(), PREVIEW_ORIGIN);
    console.log('  ✅ preview prefers PREVIEW_AUTH_URL over production NEXTAUTH_URL');
  },
);

withEnv(
  {
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
  },
  () => {
    const external = resolveSafeAuthRedirect('https://evil.example/phish', 'https://homecheff.eu');
    assert.equal(external, 'https://homecheff.eu/');
    console.log('  ✅ production blocks open redirect to evil.example');
  },
);

console.log('\n=== Result: all auth origin checks passed ===\n');
