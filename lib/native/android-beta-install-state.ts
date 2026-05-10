/**
 * Lokale state voor Android beta-updateflow (geen PII).
 * Vermindert update-loops na installer / hervatten WebView.
 */

const LS_ATTEMPTED = 'hc_apk_lastAttemptedVersion';
const LS_INSTALLED_SEEN = 'hc_apk_lastInstalledVersionSeen';
const LS_INSTALL_STARTED = 'hc_apk_installStartedAt';
const LS_INSTALLER_OPENED = 'hc_apk_installerOpenedAt';
const LS_SUPPRESS_MODAL_UNTIL = 'hc_apk_suppressModalUntil';

function safeNum(s: string | null): number {
  if (s == null || s === '') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export type AndroidBetaInstallPersist = {
  lastAttemptedVersion: string;
  lastInstalledVersionSeen: string;
  installStartedAt: number;
  installerOpenedAt: number;
  suppressModalUntil: number;
};

export function readAndroidBetaInstallPersist(): AndroidBetaInstallPersist {
  if (typeof window === 'undefined') {
    return {
      lastAttemptedVersion: '',
      lastInstalledVersionSeen: '',
      installStartedAt: 0,
      installerOpenedAt: 0,
      suppressModalUntil: 0,
    };
  }
  try {
    return {
      lastAttemptedVersion: (localStorage.getItem(LS_ATTEMPTED) ?? '').trim(),
      lastInstalledVersionSeen: (localStorage.getItem(LS_INSTALLED_SEEN) ?? '').trim(),
      installStartedAt: safeNum(localStorage.getItem(LS_INSTALL_STARTED)),
      installerOpenedAt: safeNum(localStorage.getItem(LS_INSTALLER_OPENED)),
      suppressModalUntil: safeNum(localStorage.getItem(LS_SUPPRESS_MODAL_UNTIL)),
    };
  } catch {
    return {
      lastAttemptedVersion: '',
      lastInstalledVersionSeen: '',
      installStartedAt: 0,
      installerOpenedAt: 0,
      suppressModalUntil: 0,
    };
  }
}

export function writeAndroidBetaInstallStarted(version: string): void {
  if (typeof window === 'undefined' || !version.trim()) return;
  try {
    localStorage.setItem(LS_ATTEMPTED, version.trim());
    localStorage.setItem(LS_INSTALL_STARTED, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function writeAndroidBetaInstallerOpened(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_INSTALLER_OPENED, String(Date.now()));
    // Korte onderdrukking van de grote modal direct na terugkeer vanuit het systeem.
    localStorage.setItem(LS_SUPPRESS_MODAL_UNTIL, String(Date.now() + 120_000));
  } catch {
    /* ignore */
  }
}

export function writeAndroidBetaSuppressModal(msFromNow: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_SUPPRESS_MODAL_UNTIL, String(Date.now() + Math.max(0, msFromNow)));
  } catch {
    /* ignore */
  }
}

export function writeAndroidBetaLastInstalledSeen(version: string): void {
  if (typeof window === 'undefined' || !version.trim()) return;
  try {
    localStorage.setItem(LS_INSTALLED_SEEN, version.trim());
  } catch {
    /* ignore */
  }
}

/** Na succesvolle semver “bij” server-versie: tracking wissen. */
export function clearAndroidBetaInstallTracking(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LS_ATTEMPTED);
    localStorage.removeItem(LS_INSTALL_STARTED);
    localStorage.removeItem(LS_INSTALLER_OPENED);
    localStorage.removeItem(LS_SUPPRESS_MODAL_UNTIL);
  } catch {
    /* ignore */
  }
}
