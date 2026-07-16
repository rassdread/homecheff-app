/**
 * Unit tests for Phase 2 web/native Google client separation.
 * Run: npx tsx scripts/validate-google-oauth-client-separation.ts
 */
import assert from 'node:assert/strict';
import {
  resolveGoogleWebOAuthClient,
  resolveNativeGoogleAudiences,
  resolvePublicNativeGoogleClientId,
} from '../lib/auth/google-oauth-clients';

const KEYS = [
  'GOOGLE_WEB_CLIENT_ID',
  'GOOGLE_WEB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_NATIVE_CLIENT_ID',
  'GOOGLE_NATIVE_CLIENT_IDS',
  'NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
] as const;

const saved: Record<string, string | undefined> = {};

function snapshotEnv() {
  for (const k of KEYS) saved[k] = process.env[k];
}

function restoreEnv() {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

function clearEnv() {
  for (const k of KEYS) delete process.env[k];
}

function run(name: string, fn: () => void) {
  clearEnv();
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}`);
    throw e;
  }
}

snapshotEnv();

console.log('validate-google-oauth-client-separation');

run('web prefers GOOGLE_WEB_* over legacy', () => {
  process.env.GOOGLE_WEB_CLIENT_ID = 'web-preferred.apps.googleusercontent.com';
  process.env.GOOGLE_WEB_CLIENT_SECRET = 'web-secret';
  process.env.GOOGLE_CLIENT_ID = 'legacy-web.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'legacy-secret';
  const r = resolveGoogleWebOAuthClient();
  assert.ok(r);
  assert.equal(r!.clientId, 'web-preferred.apps.googleusercontent.com');
  assert.equal(r!.clientSecret, 'web-secret');
  assert.equal(r!.source.clientId, 'GOOGLE_WEB_CLIENT_ID');
});

run('web falls back to legacy GOOGLE_CLIENT_*', () => {
  process.env.GOOGLE_CLIENT_ID = 'legacy-web.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'legacy-secret';
  const r = resolveGoogleWebOAuthClient();
  assert.ok(r);
  assert.equal(r!.clientId, 'legacy-web.apps.googleusercontent.com');
  assert.equal(r!.source.clientId, 'GOOGLE_CLIENT_ID');
});

run('web does not use NEXT_PUBLIC_*', () => {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'public-native.apps.googleusercontent.com';
  process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID = 'public-native-2.apps.googleusercontent.com';
  assert.equal(resolveGoogleWebOAuthClient(), null);
});

run('native allowlist independent from web client', () => {
  process.env.GOOGLE_CLIENT_ID = '6156-web.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'web-secret';
  process.env.GOOGLE_NATIVE_CLIENT_ID =
    '372044866667-oj37snd1j7m7qhqf98cjhbtvbad1mfg2.apps.googleusercontent.com';
  const web = resolveGoogleWebOAuthClient();
  const native = resolveNativeGoogleAudiences();
  assert.ok(web);
  assert.notEqual(web!.clientId, native.audiences[0]);
  assert.deepEqual(native.audiences, [
    '372044866667-oj37snd1j7m7qhqf98cjhbtvbad1mfg2.apps.googleusercontent.com',
  ]);
});

run('native fails closed when no native env set (even if web set)', () => {
  process.env.GOOGLE_WEB_CLIENT_ID = '6156-web.apps.googleusercontent.com';
  process.env.GOOGLE_WEB_CLIENT_SECRET = 'web-secret';
  const native = resolveNativeGoogleAudiences();
  assert.equal(native.audiences.length, 0);
});

run('native accepts comma-separated extra audiences', () => {
  process.env.GOOGLE_NATIVE_CLIENT_ID = 'native-a.apps.googleusercontent.com';
  process.env.GOOGLE_NATIVE_CLIENT_IDS =
    'native-b.apps.googleusercontent.com, native-a.apps.googleusercontent.com';
  const native = resolveNativeGoogleAudiences();
  assert.deepEqual(native.audiences, [
    'native-a.apps.googleusercontent.com',
    'native-b.apps.googleusercontent.com',
  ]);
});

run('public Capgo id prefers NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID', () => {
  process.env.NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID = 'native-public.apps.googleusercontent.com';
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'legacy-public.apps.googleusercontent.com';
  assert.equal(
    resolvePublicNativeGoogleClientId(),
    'native-public.apps.googleusercontent.com',
  );
});

run('mismatched web vs native IDs are allowed', () => {
  process.env.GOOGLE_WEB_CLIENT_ID = '6156-web.apps.googleusercontent.com';
  process.env.GOOGLE_WEB_CLIENT_SECRET = 'secret';
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = '3720-native.apps.googleusercontent.com';
  const web = resolveGoogleWebOAuthClient();
  const native = resolveNativeGoogleAudiences();
  assert.ok(web);
  assert.ok(native.audiences.includes('3720-native.apps.googleusercontent.com'));
  assert.notEqual(web!.clientId, native.audiences[0]);
});

restoreEnv();
console.log('All google oauth client separation checks passed.');
