#!/usr/bin/env node
/**
 * Bump Android version metadata only (no lint/build/Gradle).
 * Prefer full releases: `node scripts/release-android.mjs <version> --apk` etc.
 *
 * Canonical file: config/android-version.json
 *
 * Examples:
 *   node scripts/bump-android-beta-version.mjs 1.0.4
 *   node scripts/bump-android-beta-version.mjs 1.0.4 --force
 *   node scripts/bump-android-beta-version.mjs 1.0.4 --min=1.0.4 --force
 *   node scripts/bump-android-beta-version.mjs 1.0.5 --keep-min
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpAndroidVersionState, ANDROID_VERSION_FILE } from './lib/android-version-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function parseArgs(argv) {
  const out = { _: [], keepMin: false, min: null, force: null, message: null, changelog: null };
  for (const a of argv) {
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--keep-min') out.keepMin = true;
    else if (a === '--force') out.force = true;
    else if (a === '--no-force') out.force = false;
    else if (a.startsWith('--min=')) out.min = a.slice('--min='.length);
    else if (a.startsWith('--message=')) out.message = a.slice('--message='.length);
    else if (a.startsWith('--changelog=')) out.changelog = a.slice('--changelog='.length);
    else if (!a.startsWith('--')) out._.push(a);
    else {
      console.error(`Onbekend argument: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.info(`Usage:
  node scripts/bump-android-beta-version.mjs <versionName> [options]

Canonical: config/${ANDROID_VERSION_FILE} (Gradle reads this file — no hand-edit in build.gradle).

Options:
  --keep-min              Keep existing minRequiredVersion (default: min = new versionName)
  --min=x.y.z             Set minRequiredVersion explicitly
  --force / --no-force    Set forceUpdate
  --message=...           Set updateMessage
  --changelog=a,b         Comma-separated changelog

Full release (lint, build, smoke-check, Cap sync, APK/AAB):
  node scripts/release-android.mjs <versionName> --apk
  node scripts/release-android.mjs <versionName> --aab --play`);
  process.exit(0);
}

const newLatest = args._[0]?.trim();
if (!newLatest || args._.length > 1) {
  console.error(
    `Gebruik: node scripts/bump-android-beta-version.mjs <versionName> [--keep-min] [--min=x.y.z] [--force|--no-force] [--message=...] [--changelog=a,b]  (-h for help)`
  );
  process.exit(1);
}

let bump;
try {
  bump = bumpAndroidVersionState({
    root,
    newVersionName: newLatest,
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

const cfg = bump.cfg;
const changelogPreview = Array.isArray(cfg.changelog) ? cfg.changelog.slice(0, 5) : [];
console.info('');
console.info('=== bump-android-version — klaar ===');
console.info(`  versionName:            ${newLatest}`);
console.info(`  minRequiredVersion:     ${bump.nextMin}`);
console.info(`  versionCode (Gradle):   ${bump.nextCode}`);
console.info(`  forceUpdate:            ${Boolean(cfg.forceUpdate)}`);
console.info(
  `  changelog items:        ${changelogPreview.length}${changelogPreview.length ? ` (eerste: ${String(changelogPreview[0]).slice(0, 60)}…)` : ''}`
);
console.info('');
console.info('Volgende stappen (of gebruik scripts/release-android.mjs):');
console.info('  npm run build');
console.info('  npm run cap:sync');
console.info('  cd android && ./gradlew assembleRelease && cd ..');
console.info('  cp android/app/build/outputs/apk/release/app-release.apk public/downloads/homecheff-beta.apk');
console.info('');
