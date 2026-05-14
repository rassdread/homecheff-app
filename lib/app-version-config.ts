/**
 * Centrale defaults voor GET /api/app-version.
 *
 * Prioriteit: **Vercel/env-override > `config/android-version.json` > veilige fallback**.
 * Canonical versioning + Gradle: `config/android-version.json` (één bron; zie `scripts/release-android.mjs`).
 * Oudere checkout kan nog `config/android-beta-version.json` hebben — wordt nog gelezen als fallback.
 *
 * Release-workflow (aanbevolen):
 *   node scripts/release-android.mjs <versionName> --apk
 *   node scripts/release-android.mjs <versionName> --aab --play
 *
 * Alleen metadata bump (zonder lint/build/Gradle):
 *   node scripts/bump-android-beta-version.mjs <versionName> [--force] [--min=x.y.z] [--keep-min]
 */

import { readAndroidBetaVersionFile } from '@/lib/read-android-beta-version-config';

export type AppVersionApiResponse = {
  latestWebVersion: string;
  latestApkVersion: string;
  minRequiredApkVersion: string;
  apkUrl: string;
  /** Optionele update: titel (fallback in client-i18n). */
  updateTitle: string;
  /** Optionele update: tekst. */
  updateMessage: string;
  /** Verplichte update: titel (fallback in client-i18n). */
  updateTitleForced: string;
  /** Verplichte update: tekst. */
  updateMessageForced: string;
  changelog: string[];
  forceUpdate: boolean;
  enabled: boolean;
};

export const DEFAULT_UPDATE_TITLE = 'Nieuwe HomeCheff beta beschikbaar';

export const DEFAULT_UPDATE_MESSAGE =
  'Werk de app bij voor de nieuwste verbeteringen en fixes.';

export const DEFAULT_UPDATE_TITLE_FORCED = 'Update vereist';

export const DEFAULT_UPDATE_MESSAGE_FORCED =
  'Deze versie van HomeCheff wordt niet meer ondersteund. Werk de app bij om verder te gaan.';

function trimEnv(key: string): string {
  return (process.env[key] ?? '').trim();
}

/** Web-versiestring voor soft-refresh (NEXT_PUBLIC of package). */
export function resolveLatestWebVersion(): string {
  const fromEnv = trimEnv('NEXT_PUBLIC_LATEST_WEB_VERSION');
  if (fromEnv) return fromEnv;
  const pkg = trimEnv('npm_package_version');
  if (pkg) return pkg;
  return '0.1.0';
}

/** Alleen items uit config; leeg = geen changelog-sectie in de gate. */
function resolveChangelog(file: ReturnType<typeof readAndroidBetaVersionFile>): string[] {
  if (file != null && Array.isArray(file.changelog)) {
    return file.changelog.map((s) => String(s).trim()).filter(Boolean);
  }
  return [];
}

/**
 * Bouwt het JSON-antwoord voor GET /api/app-version.
 * Zonder bruikbare APK-config (geen env, geen bestand, geen URL/versie): enabled false.
 */
export function buildAppVersionResponseFromEnv(): AppVersionApiResponse {
  const file = readAndroidBetaVersionFile();

  const apkUrl =
    trimEnv('NEXT_PUBLIC_ANDROID_BETA_APK_URL') || (file?.apkUrl ?? '').trim() || '';
  const latestApkVersion =
    trimEnv('NEXT_PUBLIC_ANDROID_BETA_VERSION') || (file?.latestApkVersion ?? '').trim() || '';

  const minFromEnv = trimEnv('APP_MIN_REQUIRED_ANDROID_VERSION');
  const minFromFile = (file?.minRequiredApkVersion ?? '').trim();
  const minRequiredApkVersion =
    minFromEnv || minFromFile || latestApkVersion || '0.0.0';

  const hasApkChannel = Boolean(latestApkVersion || apkUrl);

  const envEnabledRaw = trimEnv('APP_UPDATE_ENABLED');
  const enabledFromEnv = envEnabledRaw !== '' ? envEnabledRaw.toLowerCase() === 'true' : null;
  const enabledBase =
    enabledFromEnv !== null ? enabledFromEnv : Boolean(file?.enabled ?? false);
  const enabled = enabledBase && hasApkChannel;

  const envForceRaw = trimEnv('APP_UPDATE_FORCE');
  const forceFromEnv = envForceRaw !== '' ? envForceRaw.toLowerCase() === 'true' : null;
  const forceUpdate =
    forceFromEnv !== null ? forceFromEnv : Boolean(file?.forceUpdate ?? false);

  const latestWebVersion = resolveLatestWebVersion();

  const updateTitle =
    trimEnv('APP_UPDATE_TITLE') || (file?.updateTitle ?? '').trim() || DEFAULT_UPDATE_TITLE;
  const updateMessage =
    trimEnv('APP_UPDATE_MESSAGE') ||
    (file?.updateMessage ?? '').trim() ||
    DEFAULT_UPDATE_MESSAGE;

  const updateTitleForced =
    trimEnv('APP_UPDATE_TITLE_FORCED') ||
    (file?.updateTitleForced ?? '').trim() ||
    DEFAULT_UPDATE_TITLE_FORCED;
  const updateMessageForced =
    trimEnv('APP_UPDATE_MESSAGE_FORCED') ||
    (file?.updateMessageForced ?? '').trim() ||
    DEFAULT_UPDATE_MESSAGE_FORCED;

  const changelog = resolveChangelog(file);

  return {
    latestWebVersion,
    latestApkVersion,
    minRequiredApkVersion: minRequiredApkVersion || '0.0.0',
    apkUrl,
    updateTitle,
    updateMessage,
    updateTitleForced,
    updateMessageForced,
    changelog,
    forceUpdate,
    enabled,
  };
}
