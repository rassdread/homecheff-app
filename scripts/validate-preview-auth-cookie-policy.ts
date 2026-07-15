#!/usr/bin/env npx tsx
/**
 * Ensures Preview uses host-only cookies and production keeps .homecheff.eu.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAuthSessionCookieDomain } from '../lib/auth-origin';

const PREVIEW_HOST = 'homecheff-app-git-performance-0f5539-sergio-s-projects-f7b64ee1.vercel.app';

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
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

console.log('=== Preview auth cookie policy validator ===\n');

withEnv(
  {
    VERCEL_ENV: 'preview',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
    VERCEL_URL: PREVIEW_HOST,
  },
  () => {
    assert.equal(getAuthSessionCookieDomain(), undefined);
    console.log('  ✅ preview: host-only cookie (no Domain=.homecheff.eu on vercel.app)');
  },
);

withEnv(
  {
    VERCEL_ENV: 'production',
    NODE_ENV: 'production',
    NEXTAUTH_URL: 'https://homecheff.eu',
  },
  () => {
    assert.equal(getAuthSessionCookieDomain(), '.homecheff.eu');
    console.log('  ✅ production: shared .homecheff.eu cookie domain');
  },
);

const authTs = readFileSync('lib/auth.ts', 'utf8');
assert(authTs.includes('getAuthSessionCookieDomain'), 'auth.ts uses central cookie domain');
assert(authTs.includes('getCanonicalAuthOrigin'), 'auth.ts uses canonical auth origin');
assert(!authTs.includes('getNextAuthSharedCookieDomain()'), 'legacy cookie domain import removed from auth.ts');

const cookieDomainTs = readFileSync('lib/auth-cookie-domain.ts', 'utf8');
assert(cookieDomainTs.includes('getAuthSessionCookieDomain'), 'auth-cookie-domain delegates to auth-origin');

console.log('\n=== Result: preview cookie policy checks passed ===\n');
