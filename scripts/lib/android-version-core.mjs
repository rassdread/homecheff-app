/**
 * Shared Android release metadata: read/write `config/android-version.json`,
 * semver checks, legacy `android-beta-version.json` migration shape.
 */
import fs from 'node:fs';
import path from 'node:path';

export const ANDROID_VERSION_FILE = 'android-version.json';
export const ANDROID_RELEASE_HISTORY_FILE = 'android-release-history.json';
export const LEGACY_BETA_FILE = 'android-beta-version.json';

export function semverCoreOk(v) {
  return /^\d+\.\d+\.\d+/.test(String(v).trim());
}

/** @returns {-1|0|1} a vs b (core semver only) */
export function compareSemverCore(a, b) {
  const pa = String(a)
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)/u);
  const pb = String(b)
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)/u);
  if (!pa || !pb) return 0;
  for (let i = 1; i <= 3; i++) {
    const da = Number(pa[i]);
    const db = Number(pb[i]);
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

export function configPath(root, name) {
  return path.join(root, 'config', name);
}

/**
 * Load canonical android-version.json, or migrate from legacy beta JSON once.
 * @param {string} root
 */
export function loadAndroidVersionState(root) {
  const canonical = configPath(root, ANDROID_VERSION_FILE);
  const legacy = configPath(root, LEGACY_BETA_FILE);
  if (fs.existsSync(canonical)) {
    return readJson(canonical);
  }
  if (fs.existsSync(legacy)) {
    const beta = readJson(legacy);
    return migrateLegacyBetaToCanonical(beta);
  }
  throw new Error(`Missing ${canonical} (and no ${legacy} to migrate)`);
}

export function migrateLegacyBetaToCanonical(beta) {
  const latestApkVersion = String(beta.latestApkVersion ?? '').trim();
  const minRequiredApkVersion = String(beta.minRequiredApkVersion ?? '').trim();
  const versionCode = Number(beta.versionCode);
  return {
    versionName: latestApkVersion,
    versionCode: Number.isFinite(versionCode) && versionCode >= 1 ? versionCode : 1,
    forceUpdate: Boolean(beta.forceUpdate),
    minRequiredVersion: minRequiredApkVersion || latestApkVersion,
    enabled: Boolean(beta.enabled),
    apkUrl: String(beta.apkUrl ?? '').trim(),
    updateTitle: String(beta.updateTitle ?? '').trim(),
    updateMessage: String(beta.updateMessage ?? '').trim(),
    updateTitleForced: String(beta.updateTitleForced ?? '').trim(),
    updateMessageForced: String(beta.updateMessageForced ?? '').trim(),
    changelog: Array.isArray(beta.changelog) ? beta.changelog.map((s) => String(s)) : [],
  };
}

/**
 * Apply version bump (same rules as former bump-android-beta-version.mjs).
 * @param {{
 *   root: string;
 *   newVersionName: string;
 *   keepMin: boolean;
 *   min: string | null;
 *   force: boolean | null;
 *   message: string | null;
 *   changelog: string | null;
 * }} opts
 */
export function bumpAndroidVersionState(opts) {
  const { root, newVersionName, keepMin, min, force, message, changelog } = opts;
  if (!semverCoreOk(newVersionName)) {
    throw new Error(`Invalid semver (expected major.minor.patch): ${newVersionName}`);
  }

  const canonical = configPath(root, ANDROID_VERSION_FILE);
  const cfg = loadAndroidVersionState(root);

  const prevName = String(cfg.versionName ?? '').trim();
  const prevMin = String(cfg.minRequiredVersion ?? '').trim();
  const prevCode = Number(cfg.versionCode);
  if (!Number.isFinite(prevCode) || prevCode < 1) {
    throw new Error('android-version.json: versionCode missing or invalid');
  }

  if (prevName && semverCoreOk(prevName) && compareSemverCore(newVersionName, prevName) < 0) {
    throw new Error(`Refusing to lower versionName (${newVersionName} < ${prevName})`);
  }

  const nextCode = prevCode + 1;
  if (!Number.isFinite(nextCode) || nextCode <= prevCode) {
    throw new Error(`Invalid next versionCode (${nextCode})`);
  }

  let nextMin;
  if (min != null && String(min).trim()) {
    nextMin = String(min).trim();
    if (!semverCoreOk(nextMin)) {
      throw new Error(`Invalid --min semver: ${nextMin}`);
    }
  } else if (keepMin) {
    nextMin = prevMin || newVersionName;
  } else {
    nextMin = newVersionName;
  }

  if (force === true) cfg.forceUpdate = true;
  else if (force === false) cfg.forceUpdate = false;

  if (message != null) cfg.updateMessage = message;
  if (changelog != null) {
    cfg.changelog = String(changelog)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  cfg.versionName = newVersionName;
  cfg.minRequiredVersion = nextMin;
  cfg.versionCode = nextCode;

  writeJson(canonical, cfg);

  return {
    cfg,
    canonical,
    prevCode,
    nextCode,
    nextMin,
    newVersionName,
  };
}

export function appendReleaseHistory(root, entry) {
  const p = configPath(root, ANDROID_RELEASE_HISTORY_FILE);
  let history = { releases: [] };
  if (fs.existsSync(p)) {
    try {
      history = readJson(p);
      if (!Array.isArray(history.releases)) history.releases = [];
    } catch {
      history = { releases: [] };
    }
  }
  history.releases.push(entry);
  writeJson(p, history);
}
