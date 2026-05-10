/**
 * Centrale defaults voor GET /api/app-version.
 *
 * Prioriteit: **Vercel/env-override > `config/android-beta-version.json` > veilige fallback**.
 * Normale APK-releases: bump met `node scripts/bump-android-beta-version.mjs <versie>`;
 * Vercel-env alleen voor noodsituaties (tijdelijk andere URL/min/force/uit).
 */

import { readAndroidBetaVersionFile } from '@/lib/read-android-beta-version-config';

export type AppVersionApiResponse = {
  latestWebVersion: string;
  latestApkVersion: string;
  minRequiredApkVersion: string;
  apkUrl: string;
  updateTitle: string;
  updateMessage: string;
  changelog: string[];
  forceUpdate: boolean;
  enabled: boolean;
};

export const DEFAULT_UPDATE_TITLE = 'Nieuwe HomeCheff beta beschikbaar';

export const DEFAULT_UPDATE_MESSAGE =
  'Werk de app bij voor de nieuwste verbeteringen.';

export const DEFAULT_CHANGELOG: string[] = [
  'Verbeterde chats',
  'Snellere HCP-ranglijsten',
  'Nieuwe beta-functies',
];

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

function resolveChangelog(file: ReturnType<typeof readAndroidBetaVersionFile>): string[] {
  if (file != null && Array.isArray(file.changelog)) {
    return file.changelog.map((s) => String(s));
  }
  return DEFAULT_CHANGELOG;
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

  const changelog = resolveChangelog(file);

  return {
    latestWebVersion,
    latestApkVersion,
    minRequiredApkVersion: minRequiredApkVersion || '0.0.0',
    apkUrl,
    updateTitle,
    updateMessage,
    changelog,
    forceUpdate,
    enabled,
  };
}
