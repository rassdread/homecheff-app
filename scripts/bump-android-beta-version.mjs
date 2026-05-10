#!/usr/bin/env node
/**
 * Bump Android beta metadata in source control (no Vercel hand-edit needed per APK).
 *
 * --- Normale (optionele) release ---
 *   node scripts/bump-android-beta-version.mjs 1.0.4
 *
 * --- Verplichte update (breaking / native) ---
 *   node scripts/bump-android-beta-version.mjs 1.0.4 --force
 *
 * --- Expliciet minimum + force ---
 *   node scripts/bump-android-beta-version.mjs 1.0.4 --min=1.0.4 --force
 *
 * --- Nieuwste verhogen, minimum laten staan ---
 *   node scripts/bump-android-beta-version.mjs 1.0.5 --keep-min
 *
 * Daarna lokaal:
 *   npm run build
 *   npx cap sync android
 *   cd android && ./gradlew assembleDebug && cd ..
 *   cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/homecheff-beta.apk
 *
 * Flags:
 *   --keep-min          Behoud bestaande minRequiredApkVersion (anders → zelfde als nieuwe latest).
 *   --min=1.0.2         Zet minRequiredApkVersion expliciet.
 *   --force             Zet forceUpdate true in JSON.
 *   --no-force          Zet forceUpdate false.
 *   --message="..."     updateMessage in JSON.
 *   --changelog="a,b"   changelog-array (komma-gescheiden).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const configPath = path.join(root, 'config', 'android-beta-version.json');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');

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

function semverCoreOk(v) {
  return /^\d+\.\d+\.\d+/.test(String(v).trim());
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function bumpGradle(versionName, versionCode) {
  let g = fs.readFileSync(gradlePath, 'utf8');
  g = g.replace(/versionCode\s+\d+/u, `versionCode ${versionCode}`);
  g = g.replace(/versionName\s+"[^"]*"/u, `versionName "${versionName}"`);
  fs.writeFileSync(gradlePath, g, 'utf8');
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.info(`Usage:
  node scripts/bump-android-beta-version.mjs <latestApkVersion> [options]

Options:
  --keep-min              Keep existing minRequiredApkVersion (default: set min = new latest)
  --min=x.y.z             Set minRequiredApkVersion explicitly
  --force / --no-force    Set forceUpdate in config
  --message=...           Set updateMessage
  --changelog=a,b         Set changelog (comma-separated)

Examples (optional vs forced):
  node scripts/bump-android-beta-version.mjs 1.0.4
  node scripts/bump-android-beta-version.mjs 1.0.4 --force
  node scripts/bump-android-beta-version.mjs 1.0.4 --min=1.0.4 --force
  node scripts/bump-android-beta-version.mjs 1.0.5 --keep-min

After bump (build, sync, APK copy):
  npm run build
  npx cap sync android
  cd android && ./gradlew assembleDebug && cd ..
  cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/homecheff-beta.apk`);
  process.exit(0);
}

const newLatest = args._[0]?.trim();
if (!newLatest || args._.length > 1) {
  console.error(
    'Gebruik: node scripts/bump-android-beta-version.mjs <latestApkVersion> [--keep-min] [--min=x.y.z] [--force|--no-force] [--message=...] [--changelog=a,b]  (-h for help)'
  );
  process.exit(1);
}
if (!semverCoreOk(newLatest)) {
  console.error(`Ongeldige versie (verwacht major.minor.patch): ${newLatest}`);
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  console.error(`Ontbrekend: ${configPath}`);
  process.exit(1);
}

const cfg = readJson(configPath);
const prevMin = String(cfg.minRequiredApkVersion ?? '').trim();
const prevCode = Number(cfg.versionCode);
if (!Number.isFinite(prevCode) || prevCode < 1) {
  console.error('config: versionCode ontbreekt of ongeldig');
  process.exit(1);
}

let nextMin;
if (args.min != null && String(args.min).trim()) {
  nextMin = String(args.min).trim();
  if (!semverCoreOk(nextMin)) {
    console.error(`Ongeldige --min: ${nextMin}`);
    process.exit(1);
  }
} else if (args.keepMin) {
  nextMin = prevMin || newLatest;
} else {
  nextMin = newLatest;
}

const nextCode = prevCode + 1;

if (args.force === true) cfg.forceUpdate = true;
else if (args.force === false) cfg.forceUpdate = false;

if (args.message != null) cfg.updateMessage = args.message;
if (args.changelog != null) {
  cfg.changelog = String(args.changelog)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

cfg.latestApkVersion = newLatest;
cfg.minRequiredApkVersion = nextMin;
cfg.versionCode = nextCode;

writeJson(configPath, cfg);
bumpGradle(newLatest, nextCode);

const changelogPreview = Array.isArray(cfg.changelog) ? cfg.changelog.slice(0, 5) : [];
console.info('');
console.info('=== bump-android-beta-version — klaar ===');
console.info(`  latestApkVersion:      ${newLatest}`);
console.info(`  minRequiredApkVersion: ${nextMin}`);
console.info(`  versionCode (Gradle):  ${nextCode}`);
console.info(`  forceUpdate:           ${Boolean(cfg.forceUpdate)}`);
console.info(
  `  changelog items:       ${changelogPreview.length}${changelogPreview.length ? ` (eerste: ${changelogPreview[0]?.slice(0, 60)}…)` : ''}`
);
console.info('');
console.info('Volgende stappen:');
console.info('  npm run build');
console.info('  npx cap sync android');
console.info('  cd android && ./gradlew assembleDebug && cd ..');
console.info('  cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/homecheff-beta.apk');
console.info('');
