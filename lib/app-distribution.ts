/**
 * Android app distribution (Play Open Testing vs legacy sideload).
 * Client-safe helpers use NEXT_PUBLIC_* env vars.
 */

export type AppDistributionMode = 'play' | 'sideload' | 'dual';

export const PLAY_STORE_INSTALLER_PACKAGE = 'com.android.vending';

export const HC_PLAY_MIGRATION_DISMISSED_LS = 'hc_play_migration_dismissed';

/** Google Play Open Testing / listing URL (public env). */
export function getGooglePlayOpenTestingUrl(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_PLAY_OPEN_TESTING_URL ?? '').trim();
}

export function resolveAppDistribution(): AppDistributionMode {
  const raw = (process.env.NEXT_PUBLIC_APP_DISTRIBUTION ?? 'play').trim().toLowerCase();
  if (raw === 'sideload' || raw === 'dual') return raw;
  return 'play';
}

export function isPlayOpenTestingUrlConfigured(url?: string): boolean {
  const u = (url ?? getGooglePlayOpenTestingUrl()).trim();
  return u.startsWith('https://play.google.com/');
}

export function readPlayMigrationDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HC_PLAY_MIGRATION_DISMISSED_LS) === '1';
  } catch {
    return false;
  }
}

export function writePlayMigrationDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HC_PLAY_MIGRATION_DISMISSED_LS, '1');
    window.dispatchEvent(new Event('hc-play-migration-dismissed'));
  } catch {
    /* ignore */
  }
}
