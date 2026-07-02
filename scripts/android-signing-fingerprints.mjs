#!/usr/bin/env node
/**
 * Print SHA-1 / SHA-256 for Android keystores (debug + release upload key).
 * Register all fingerprints in Firebase → Android app eu.homecheff.mobile.
 * Also add Google Play Console → App signing key certificate (different from upload key).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const androidDir = path.join(root, 'android');
const propsPath = path.join(androidDir, 'keystore.properties');

const PACKAGE = 'eu.homecheff.mobile';

function runKeytool(args) {
  const r = spawnSync('keytool', args, { encoding: 'utf8' });
  if ((r.status ?? 1) !== 0) {
    return { ok: false, detail: (r.stderr || r.stdout || '').trim() };
  }
  return { ok: true, out: r.stdout || '' };
}

function parseFingerprints(text) {
  const sha1 = text.match(/SHA1:\s*([0-9A-F:]+)/i)?.[1] ?? null;
  const sha256 = text.match(/SHA256:\s*([0-9A-F:]+)/i)?.[1] ?? null;
  return { sha1, sha256 };
}

function printBlock(label, fp) {
  console.info(`\n=== ${label} ===`);
  if (!fp.sha1 && !fp.sha256) {
    console.info('  (could not parse fingerprints)');
    return;
  }
  if (fp.sha1) console.info(`  SHA-1:   ${fp.sha1}`);
  if (fp.sha256) console.info(`  SHA-256: ${fp.sha256}`);
}

function loadReleaseKeystore() {
  if (!fs.existsSync(propsPath)) return null;
  const lines = fs.readFileSync(propsPath, 'utf8').split('\n');
  const map = Object.fromEntries(
    lines
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
  const storeFile = map.storeFile;
  if (!storeFile) return null;
  const ks = path.isAbsolute(storeFile)
    ? storeFile
    : path.join(androidDir, storeFile);
  return {
    path: ks,
    alias: map.keyAlias || 'homecheff',
    password: map.storePassword || '',
  };
}

console.info(`\nHomeCheff Android signing fingerprints (${PACKAGE})\n`);

const keytoolCheck = spawnSync('keytool', ['-help'], { encoding: 'utf8' });
if ((keytoolCheck.status ?? 1) !== 0 && /Unable to locate a Java Runtime/i.test(keytoolCheck.stderr || '')) {
  console.error('keytool not available — install JDK 17+ and ensure JAVA_HOME is set.');
  process.exit(1);
}

const debugKs = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.android',
  'debug.keystore',
);
if (fs.existsSync(debugKs)) {
  const r = runKeytool([
    '-list',
    '-v',
    '-keystore',
    debugKs,
    '-alias',
    'androiddebugkey',
    '-storepass',
    'android',
    '-keypass',
    'android',
  ]);
  printBlock('Debug keystore (~/.android/debug.keystore)', r.ok ? parseFingerprints(r.out) : {});
} else {
  console.info('\n=== Debug keystore ===\n  (not found — run Android Studio once to create ~/.android/debug.keystore)');
}

const release = loadReleaseKeystore();
if (release && fs.existsSync(release.path)) {
  const r = runKeytool([
    '-list',
    '-v',
    '-keystore',
    release.path,
    '-alias',
    release.alias,
    '-storepass',
    release.password,
  ]);
  printBlock(`Release upload keystore (${path.basename(release.path)})`, r.ok ? parseFingerprints(r.out) : {});
  if (!r.ok) console.error('  keytool error:', r.detail);
} else {
  console.info('\n=== Release upload keystore ===\n  (android/keystore.properties or .jks missing)');
}

const releaseCfgPath = path.join(root, 'config', 'android-release.json');
if (fs.existsSync(releaseCfgPath)) {
  const cfg = JSON.parse(fs.readFileSync(releaseCfgPath, 'utf8'));
  const expected = cfg.expectedSigningSha256;
  if (expected) {
    console.info('\n=== Expected beta APK signing (config/android-release.json) ===');
    console.info(`  SHA-256: ${String(expected).replace(/(.{2})/g, '$1:').slice(0, -1) || expected}`);
  }
}

console.info(`
=== Google Play App Signing (required for Open Testing) ===
  Play Console → HomeCheff → Setup → App integrity → App signing key certificate
  Copy SHA-1 and SHA-256 there into Firebase (same Android app: ${PACKAGE}).

=== Firebase ===
  https://console.firebase.google.com/project/homecheff-cbb05/settings/general
  → Your apps → ${PACKAGE} → Add fingerprint (all SHA above)
  → Download google-services.json → android/app/google-services.json
  → Run: node scripts/validate-google-services.mjs

=== Google Cloud OAuth (same project) ===
  APIs & Services → Credentials — Web client id must match NEXT_PUBLIC_GOOGLE_CLIENT_ID
  OAuth consent screen: Published, package ${PACKAGE}
`);
