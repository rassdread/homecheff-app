/**
 * Centrale defaults voor /api/app-version + client.
 * Server leest env; ontbrekende kritieke waarden → enabled: false.
 */

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

/**
 * Bouwt het JSON-antwoord voor GET /api/app-version.
 * Zonder bruikbare APK-config: enabled false, rest veilige defaults.
 */
export function buildAppVersionResponseFromEnv(): AppVersionApiResponse {
  const apkUrl = trimEnv('NEXT_PUBLIC_ANDROID_BETA_APK_URL');
  const latestApkVersion = trimEnv('NEXT_PUBLIC_ANDROID_BETA_VERSION');
  const minRequiredApkVersion =
    trimEnv('APP_MIN_REQUIRED_ANDROID_VERSION') || latestApkVersion || '0.0.0';

  const hasApkChannel = Boolean(latestApkVersion || apkUrl);
  /** Alleen aan met `APP_UPDATE_ENABLED=true` én minimaal APK-URL of -versie (veilige default). */
  const enabled =
    trimEnv('APP_UPDATE_ENABLED').toLowerCase() === 'true' && hasApkChannel;

  const latestWebVersion = resolveLatestWebVersion();

  return {
    latestWebVersion,
    latestApkVersion: latestApkVersion || '0.0.0',
    minRequiredApkVersion: minRequiredApkVersion || '0.0.0',
    apkUrl,
    updateTitle: trimEnv('APP_UPDATE_TITLE') || DEFAULT_UPDATE_TITLE,
    updateMessage: trimEnv('APP_UPDATE_MESSAGE') || DEFAULT_UPDATE_MESSAGE,
    changelog: DEFAULT_CHANGELOG,
    forceUpdate: trimEnv('APP_UPDATE_FORCE').toLowerCase() === 'true',
    enabled,
  };
}
