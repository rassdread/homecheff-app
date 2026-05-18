/**
 * APK identity checks for beta release (package name, version, signing).
 * Uses Android SDK build-tools (aapt/aapt2) and apksigner when available.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function sdkRoot() {
  return process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
}

function findBuildToolsBinary(name) {
  const root = sdkRoot();
  if (!root) return null;
  const btDir = path.join(root, 'build-tools');
  if (!fs.existsSync(btDir)) return null;
  const versions = fs
    .readdirSync(btDir)
    .filter((d) => fs.statSync(path.join(btDir, d)).isDirectory())
    .sort()
    .reverse();
  for (const ver of versions) {
    const candidate = path.join(btDir, ver, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function run(cmd, args) {
  return spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}

/**
 * @param {string} apkPath
 */
export function dumpApkBadging(apkPath) {
  if (!fs.existsSync(apkPath)) {
    return { ok: false, reason: 'apk_missing', path: apkPath };
  }
  const aapt2 = findBuildToolsBinary('aapt2');
  const aapt = findBuildToolsBinary('aapt');
  const bin = aapt2 || aapt;
  if (!bin) {
    return { ok: false, reason: 'aapt_not_found', hint: 'Set ANDROID_HOME to Android SDK' };
  }
  const args = aapt2 ? ['dump', 'badging', apkPath] : ['dump', 'badging', apkPath];
  const r = run(bin, args);
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  if ((r.status ?? 1) !== 0) {
    return { ok: false, reason: 'aapt_failed', detail: out.slice(0, 500) };
  }
  const packageName = out.match(/package: name='([^']+)'/)?.[1] ?? null;
  const versionCode = out.match(/versionCode='(\d+)'/)?.[1] ?? null;
  const versionName = out.match(/versionName='([^']+)'/)?.[1] ?? null;
  const applicationLabel = out.match(/application-label:'([^']+)'/)?.[1] ?? null;
  return {
    ok: true,
    packageName,
    versionCode: versionCode != null ? Number(versionCode) : null,
    versionName,
    applicationLabel,
  };
}

/**
 * @param {string} apkPath
 */
export function verifyApkCerts(apkPath) {
  if (!fs.existsSync(apkPath)) {
    return { ok: false, reason: 'apk_missing' };
  }
  const apksigner = findBuildToolsBinary('apksigner');
  if (!apksigner) {
    const r = run('apksigner', ['verify', '--print-certs', apkPath]);
    if ((r.status ?? 1) !== 0) {
      return { ok: false, reason: 'apksigner_failed', unsigned: /DOES NOT VERIFY/i.test(r.stderr || r.stdout || '') };
    }
    return parseApksignerOutput(r.stdout || '');
  }
  const r = run(apksigner, ['verify', '--print-certs', apkPath]);
  if ((r.status ?? 1) !== 0) {
    return {
      ok: false,
      reason: 'apksigner_failed',
      unsigned: /not signed|DOES NOT VERIFY|no certificates/i.test(`${r.stdout}\n${r.stderr}`),
      detail: (r.stderr || r.stdout || '').slice(0, 400),
    };
  }
  return parseApksignerOutput(r.stdout || '');
}

function parseApksignerOutput(text) {
  const sha256Matches = [...text.matchAll(/SHA-256 digest:\s*([a-fA-F0-9:]+)/g)].map((m) =>
    m[1].replace(/:/g, '').toLowerCase(),
  );
  const sha256 = sha256Matches[0] ?? null;
  return {
    ok: true,
    signed: sha256Matches.length > 0,
    sha256,
    allSha256: sha256Matches,
  };
}

/**
 * @param {object} opts
 * @param {string} opts.apkPath
 * @param {string} opts.expectedApplicationId
 * @param {string | null | undefined} opts.expectedSigningSha256
 * @param {boolean} opts.requireSigned
 */
export function validateApkIdentity(opts) {
  const errors = [];
  const badging = dumpApkBadging(opts.apkPath);
  if (!badging.ok) {
    errors.push(`Could not read APK metadata (${badging.reason}).`);
    return { ok: false, errors, badging, certs: null };
  }
  if (badging.packageName !== opts.expectedApplicationId) {
    errors.push(
      `APK packageId is "${badging.packageName}" but expected "${opts.expectedApplicationId}". ` +
        'This would install as a second app on the device.',
    );
  }
  const certs = verifyApkCerts(opts.apkPath);
  if (opts.requireSigned) {
    if (!certs.ok || !certs.signed) {
      errors.push(
        'APK is not signed (or apksigner verify failed). Unsigned/sideways-signed APKs cannot replace the installed beta app.',
      );
    }
  }
  if (
    opts.expectedSigningSha256 &&
    certs?.ok &&
    certs.sha256 &&
    certs.sha256 !== opts.expectedSigningSha256.replace(/:/g, '').toLowerCase()
  ) {
    errors.push(
      `APK signing SHA-256 does not match expected beta key. ` +
        'Testers with the old key must uninstall once, then install the new signed APK.',
    );
  }
  return {
    ok: errors.length === 0,
    errors,
    badging,
    certs,
  };
}
