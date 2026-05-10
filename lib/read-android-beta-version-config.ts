import fs from 'node:fs';
import path from 'node:path';

/** Shape of `config/android-beta-version.json` (source of truth; env may override at runtime). */
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

/**
 * Reads `config/android-beta-version.json` from repo root (process.cwd()).
 * Returns null if missing or invalid (caller falls back to env-only / disabled).
 */
export function readAndroidBetaVersionFile(): AndroidBetaVersionFile | null {
  const full = path.join(process.cwd(), 'config', 'android-beta-version.json');
  try {
    const raw = fs.readFileSync(full, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const latestApkVersion = String(parsed.latestApkVersion ?? '').trim();
    const minRequiredApkVersion = String(parsed.minRequiredApkVersion ?? '').trim();
    const apkUrl = String(parsed.apkUrl ?? '').trim();
    const updateTitle = String(parsed.updateTitle ?? '').trim();
    const updateMessage = String(parsed.updateMessage ?? '').trim();
    const updateTitleForced = String(parsed.updateTitleForced ?? '').trim();
    const updateMessageForced = String(parsed.updateMessageForced ?? '').trim();
    const changelog = asStringArray(parsed.changelog) ?? [];
    const versionCode = Number(parsed.versionCode);
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
  } catch {
    return null;
  }
}
