import type { AndroidBetaUpdateDerived } from '@/lib/android-beta-update-derived';

const INSTALL_GRACE_MS = 600_000; // 10 min — OEM / gebruiker voltooit installatie

/**
 * Past UI-gating toe naast pure semver (`deriveAndroidBetaUpdate`):
 * - korte onderdrukking van de grote modal na installer / hervatten WebView;
 * - herinnering i.p.v. herhaalde modals zolang update nog niet live is.
 */
export function applyAndroidBetaInstallFlowAdjustments(
  base: AndroidBetaUpdateDerived,
  opts: {
    now: number;
    suppressModalUntil: number;
    installerOpenedAt: number;
    lastAttemptedVersion: string;
    currentVersion: string | null;
    latestApkVersion: string;
  }
): AndroidBetaUpdateDerived {
  void opts.lastAttemptedVersion;
  void opts.currentVersion;
  void opts.latestApkVersion;

  const d = { ...base };

  if (opts.now < opts.suppressModalUntil) {
    if (!d.forceUi) {
      d.optionalModal = false;
      if (d.optionalAvailable) {
        d.optionalReminder = true;
      }
    }
  }

  if (
    opts.installerOpenedAt > 0 &&
    opts.now - opts.installerOpenedAt < INSTALL_GRACE_MS &&
    d.belowLatest &&
    !d.forceUi
  ) {
    d.optionalModal = false;
    if (d.optionalAvailable) {
      d.optionalReminder = true;
    }
  }

  return d;
}
