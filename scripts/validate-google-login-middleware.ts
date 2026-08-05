#!/usr/bin/env npx tsx
/**
 * Assert middleware canonical-host policy for OAuth safety (source inspection).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const middleware = readFileSync(join(process.cwd(), 'middleware.ts'), 'utf8');

assert.match(middleware, /www\.homecheff\.eu/);
assert.match(middleware, /NEXTAUTH_SESSION_COOKIE_NAME/);
assert.match(middleware, /cookieName:\s*NEXTAUTH_SESSION_COOKIE_NAME/);
assert.match(middleware, /homecheff\.nl/);
assert.doesNotMatch(
  middleware,
  /await import\(\s*['"]@\/lib\/auth\/session-cookie-name['"]\s*\)/,
);

console.log('  ✅ middleware www→apex + getToken cookieName present');
console.log('1 checks passed.');
