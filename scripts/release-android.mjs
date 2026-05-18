#!/usr/bin/env node
/**
 * Unified Android release: bump `config/android-version.json`, quality gates,
 * Capacitor sync, Gradle APK and/or AAB (Play).
 *
 * Usage:
 *   node scripts/release-android.mjs 1.0.13 --apk
 *   node scripts/release-android.mjs 1.0.13 --aab --play --changelog="Fix onboarding"
 *   node scripts/release-android.mjs 1.0.13 --bump-only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  ANDROID_VERSION_FILE,
  appendReleaseHistory,
  bumpAndroidVersionState,
} from './lib/android-version-core.mjs';
import { validateApkIdentity } from './lib/apk-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function parseArgs(argv) {
  const out = {
    _: [],
    apk: false,
    aab: false,
    play: false,
    bumpOnly: false,
    keepMin: false,
    min: null,
    force: null,
    message: null,
    changelog: null,
  };
  for (const a of argv) {
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--apk') out.apk = true;
    else if (a === '--aab') out.aab = true;
    else if (a === '--play') out.play = true;
    else if (a === '--bump-only') out.bumpOnly = true;
    else if (a === '--keep-min') out.keepMin = true;
    else if (a === '--force') out.force = true;
    else if (a === '--no-force') out.force = false;
    else if (a.startsWith('--min=')) out.min = a.slice('--min='.length);
    else if (a.startsWith('--message=')) out.message = a.slice('--message='.length);
    else if (a.startsWith('--changelog=')) out.changelog = a.slice('--changelog='.length);
    else if (!a.startsWith('--')) out._.push(a);
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function run(cmd, args, cwd = root) {
  const shell = process.platform === 'win32';
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell });
  if ((r.status ?? 1) !== 0) {
    console.error(`\nCommand failed (${r.status}): ${[cmd, ...args].join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

function runQuality() {
  console.info('\n=== Quality gates (lint, build, smoke-check) ===\n');
  run('npm', ['run', 'lint']);
  run('npm', ['run', 'build']);
  run('npm', ['run', 'smoke-check']);
}

function gradleTask(task) {
  const androidDir = path.join(root, 'android');
  const gw = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  run(gw, [task], androidDir);
}

function loadAndroidReleaseConfig(root) {
  const p = path.join(root, 'config', 'android-release.json');
  if (!fs.existsSync(p)) {
    return {
      expectedApplicationId: 'eu.homecheff.mobile',
      expectedSigningSha256: null,
      requireSignedReleaseApk: true,
      rejectUnsignedApkForBetaDownload: true,
    };
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function validateBetaApkBeforePublish(root, apkPath) {
  const cfg = loadAndroidReleaseConfig(root);
  const expectedId = String(cfg.expectedApplicationId || 'eu.homecheff.mobile').trim();
  const expectedSha =
    cfg.expectedSigningSha256 != null && String(cfg.expectedSigningSha256).trim()
      ? String(cfg.expectedSigningSha256).replace(/:/g, '').toLowerCase()
      : null;
  const requireSigned = cfg.requireSignedReleaseApk !== false;

  console.info('\n=== APK identity check (beta download) ===\n');
  const result = validateApkIdentity({
    apkPath,
    expectedApplicationId: expectedId,
    expectedSigningSha256: expectedSha,
    requireSigned: requireSigned,
  });

  if (result.badging?.ok) {
    console.info(`  package:      ${result.badging.packageName}`);
    console.info(`  versionName:  ${result.badging.versionName}`);
    console.info(`  versionCode:  ${result.badging.versionCode}`);
    if (result.certs?.ok && result.certs.sha256) {
      console.info(`  signing SHA-256: ${result.certs.sha256}`);
    }
  }

  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`\n✗ ${err}`);
    }
    console.error(
      '\nRelease aborted: APK packageId differs or signing is invalid — this would install as a second app or fail to update.',
    );
    process.exit(1);
  }

  if (expectedSha && result.certs?.sha256 && result.certs.sha256 !== expectedSha) {
    console.error('\n✗ APK signing SHA-256 does not match config/android-release.json expectedSigningSha256');
    process.exit(1);
  }

  console.info('\n✓ APK identity OK (same applicationId; signed for in-place update)\n');
  return result;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function findReleaseApk() {
  const releaseDir = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release');
  if (!fs.existsSync(releaseDir)) return null;
  const candidates = ['app-release.apk', 'app-release-unsigned.apk'];
  for (const name of candidates) {
    const p = path.join(releaseDir, name);
    if (fs.existsSync(p)) return p;
  }
  const any = fs.readdirSync(releaseDir).filter((f) => f.endsWith('.apk'));
  return any.length ? path.join(releaseDir, any[0]) : null;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.info(`HomeCheff Android release

Usage:
  node scripts/release-android.mjs <versionName> [options]

Canonical config: config/${ANDROID_VERSION_FILE} (versionName, versionCode, minRequiredVersion, …)
Gradle reads the same file — no duplicate versionCode in build.gradle.

Options:
  --apk              ./gradlew assembleRelease; copy APK to public/downloads/homecheff-beta.apk
  --aab              ./gradlew bundleRelease → app-release.aab
  --play             With --aab: also copy AAB to release-artifacts/homecheff-<ver>-<code>.aab
  --bump-only        Bump JSON + release history only (no lint/build/smoke, no Cap/Gradle)
  --keep-min         Keep existing minRequiredVersion (default: set min to new versionName)
  --min=x.y.z        Set minRequiredVersion explicitly
  --force / --no-force   Set forceUpdate in ${ANDROID_VERSION_FILE}
  --message=...      Set updateMessage
  --changelog=...    Comma-separated changelog lines

Examples:
  node scripts/release-android.mjs 1.0.13 --apk --force
  node scripts/release-android.mjs 1.0.13 --aab --play --changelog="Improve navigation"

Outputs:
  APK: android/app/build/outputs/apk/release/*.apk  →  public/downloads/homecheff-beta.apk
  AAB: android/app/build/outputs/bundle/release/app-release.aab
`);
  process.exit(0);
}

const versionArg = args._[0]?.trim();
if (!versionArg || args._.length > 1) {
  console.error('Usage: node scripts/release-android.mjs <versionName> [options]  (-h for help)');
  process.exit(1);
}

const wantAab = args.aab || args.play;
const wantApk = args.apk;

if (!args.bumpOnly && !wantApk && !wantAab) {
  console.error('Specify at least one of: --apk, --aab, --play, or --bump-only');
  process.exit(1);
}

if (args.bumpOnly && (wantApk || wantAab)) {
  console.error('--bump-only cannot be combined with --apk / --aab / --play');
  process.exit(1);
}

if (!args.bumpOnly) {
  runQuality();
} else {
  console.info('\n(--bump-only: skipping lint / build / smoke-check — run full release for gates)\n');
}

let bump;
try {
  bump = bumpAndroidVersionState({
    root,
    newVersionName: versionArg,
    keepMin: args.keepMin,
    min: args.min,
    force: args.force,
    message: args.message,
    changelog: args.changelog,
  });
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

console.info('\n=== Version bump complete ===');
console.info(`  ${path.relative(root, bump.canonical)}`);
console.info(`  versionName:           ${bump.newVersionName}`);
console.info(`  minRequiredVersion:    ${bump.nextMin}`);
console.info(`  versionCode:           ${bump.nextCode}`);
console.info(`  forceUpdate:           ${Boolean(bump.cfg.forceUpdate)}`);

const timestamp = new Date().toISOString();
const artifacts = [];
if (wantApk) artifacts.push('apk');
if (wantAab) artifacts.push('aab');
appendReleaseHistory(root, {
  versionName: bump.newVersionName,
  versionCode: bump.nextCode,
  at: timestamp,
  changelog: args.changelog ?? null,
  artifacts,
});

if (args.bumpOnly) {
  console.info('\n--bump-only: skipping Capacitor sync and Gradle.\n');
  process.exit(0);
}

console.info('\n=== Capacitor sync ===\n');
run('npm', ['run', 'cap:sync']);

if (wantApk) {
  console.info('\n=== Gradle assembleRelease (APK) ===\n');
  gradleTask('assembleRelease');
  const built = findReleaseApk();
  const dest = path.join(root, 'public', 'downloads', 'homecheff-beta.apk');
  if (built) {
    const cfg = loadAndroidReleaseConfig(root);
    if (cfg.rejectUnsignedApkForBetaDownload !== false) {
      validateBetaApkBeforePublish(root, built);
    }
    copyFile(built, dest);
    console.info(`\nCopied:\n  ${built}\n  → ${dest}`);
  } else {
    console.warn('\nNo release APK found under android/app/build/outputs/apk/release/');
  }
}

if (wantAab) {
  console.info('\n=== Gradle bundleRelease (AAB) ===\n');
  gradleTask('bundleRelease');
  const aab = path.join(root, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  console.info(`\nAAB:\n  ${aab}`);
  if (args.play && fs.existsSync(aab)) {
    const outDir = path.join(root, 'release-artifacts');
    const name = `homecheff-${bump.newVersionName}-${bump.nextCode}.aab`;
    const dest = path.join(outDir, name);
    copyFile(aab, dest);
    console.info(`Play upload copy:\n  ${dest}`);
  } else if (args.play && !fs.existsSync(aab)) {
    console.warn('Expected AAB missing after bundleRelease.');
  }
}

console.info('\n=== Done ===\n');
