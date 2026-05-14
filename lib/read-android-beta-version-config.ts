import fs from 'node:fs';
import path from 'node:path';

/**
 * Shape returned for GET /api/app-version (file layer).
 * Canonical on disk: `config/android-version.json`.
 * Legacy: `config/android-beta-version.json` (older repos).
 */
export type AndroidBetaVersionFile = {
  enabled: boolean;
  latestApkVersion: string;
  minRequiredApkVersion: string;
  versionCode: number;
  forceUpdate: boolean;
  apkUrl: string;
  updateTitle: string;
  updateMessage: string;
  updateTitleForced: string;
  updateMessageForced: string;
  changelog: string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.map((x) => String(x));
}

function parseCanonicalAndroidVersion(parsed: Record<string, unknown>): AndroidBetaVersionFile | null {
  const versionName = String(parsed.versionName ?? '').trim();
  const minRequiredVersion = String(parsed.minRequiredVersion ?? '').trim();
  const apkUrl = String(parsed.apkUrl ?? '').trim();
  const updateTitle = String(parsed.updateTitle ?? '').trim();
  const updateMessage = String(parsed.updateMessage ?? '').trim();
  const updateTitleForced = String(parsed.updateTitleForced ?? '').trim();
  const updateMessageForced = String(parsed.updateMessageForced ?? '').trim();
  const changelog = asStringArray(parsed.changelog) ?? [];
  const versionCode = Number(parsed.versionCode);
  if (!versionName) return null;
  if (!Number.isFinite(versionCode) || versionCode < 1) return null;
  return {
    enabled: Boolean(parsed.enabled),
    latestApkVersion: versionName,
    minRequiredApkVersion: minRequiredVersion || versionName,
    versionCode,
    forceUpdate: Boolean(parsed.forceUpdate),
    apkUrl,
    updateTitle,
    updateMessage,
    updateTitleForced,
    updateMessageForced,
    changelog,
  };
}

function parseLegacyBeta(parsed: Record<string, unknown>): AndroidBetaVersionFile | null {
  const latestApkVersion = String(parsed.latestApkVersion ?? '').trim();
  const minRequiredApkVersion = String(parsed.minRequiredApkVersion ?? '').trim();
  const apkUrl = String(parsed.apkUrl ?? '').trim();
  const updateTitle = String(parsed.updateTitle ?? '').trim();
  const updateMessage = String(parsed.updateMessage ?? '').trim();
  const updateTitleForced = String(parsed.updateTitleForced ?? '').trim();
  const updateMessageForced = String(parsed.updateMessageForced ?? '').trim();
  const changelog = asStringArray(parsed.changelog) ?? [];
  const versionCode = Number(parsed.versionCode);
  if (!latestApkVersion) return null;
  if (!Number.isFinite(versionCode) || versionCode < 1) return null;
  return {
    enabled: Boolean(parsed.enabled),
    latestApkVersion,
    minRequiredApkVersion,
    versionCode,
    forceUpdate: Boolean(parsed.forceUpdate),
    apkUrl,
    updateTitle,
    updateMessage,
    updateTitleForced,
    updateMessageForced,
    changelog,
  };
}

/**
 * Reads `config/android-version.json` from repo root (process.cwd()).
 * If missing, falls back to `config/android-beta-version.json`.
 * Returns null if missing or invalid (caller falls back to env-only / disabled).
 */
export function readAndroidBetaVersionFile(): AndroidBetaVersionFile | null {
  const canonical = path.join(process.cwd(), 'config', 'android-version.json');
  const legacy = path.join(process.cwd(), 'config', 'android-beta-version.json');
  try {
    if (fs.existsSync(canonical)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(canonical, 'utf8'));
      if (!isRecord(parsed)) return null;
      return parseCanonicalAndroidVersion(parsed) ?? parseLegacyBeta(parsed);
    }
    if (fs.existsSync(legacy)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(legacy, 'utf8'));
      if (!isRecord(parsed)) return null;
      return parseLegacyBeta(parsed) ?? parseCanonicalAndroidVersion(parsed);
    }
    return null;
  } catch {
    return null;
  }
}
