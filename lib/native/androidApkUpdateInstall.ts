'use client';

import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { HomecheffApkInstaller } from '@/lib/native/homecheffApkInstaller';
import {
  writeAndroidBetaInstallStarted,
  writeAndroidBetaInstallerOpened,
} from '@/lib/native/android-beta-install-state';

const CACHE_APK_PATH = 'updates/homecheff-beta.apk';
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export type ApkInstallPhase =
  | 'idle'
  | 'downloading'
  | 'preparing'
  | 'opening'
  | 'done'
  | 'error';

export type ApkInstallFailureKind =
  | 'generic'
  | 'unknown_sources'
  | 'no_handler'
  | 'download_timeout'
  | 'network';

export type ApkInstallResult =
  | { ok: true }
  | {
      ok: false;
      fallbackToBrowser: boolean;
      message: string;
      kind: ApkInstallFailureKind;
    };

function dispatchInstallPersistChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('hc-apk-install-persist-changed'));
  } catch {
    /* ignore */
  }
}

async function deleteCachedApkBestEffort(): Promise<void> {
  try {
    await Filesystem.deleteFile({
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
    });
  } catch {
    /* bestand bestond niet of al weg */
  }
}

/** Heuristiek op plugin-/Capacitor-fout (geen stack naar UI). */
export function classifyApkInstallError(e: unknown): ApkInstallFailureKind {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.toLowerCase();
  if (m.includes('timeout') || m.includes('timed out')) {
    return 'download_timeout';
  }
  if (
    m.includes('unknown') ||
    (m.includes('package') && m.includes('blocked')) ||
    m.includes('install_blocked') ||
    m.includes('not allowed') ||
    m.includes('security')
  ) {
    return 'unknown_sources';
  }
  if (m.includes('no_install_handler') || m.includes('no app can handle')) {
    return 'no_handler';
  }
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('internet')) {
    return 'network';
  }
  return 'generic';
}

/**
 * Download APK naar app-cache en start ACTION_VIEW (package installer).
 * Alleen voor Capacitor Android; elders niet aanroepen.
 *
 * @param targetVersion Server-APK-versie (semver) voor anti-loop tracking; mag leeg zijn.
 */
export async function downloadApkAndOpenInstaller(
  apkUrl: string,
  targetVersion: string,
  onPhase: (phase: ApkInstallPhase, progressPct?: number) => void
): Promise<ApkInstallResult> {
  if (!apkUrl || !/^https:\/\//i.test(apkUrl)) {
    return {
      ok: false,
      fallbackToBrowser: true,
      message: 'Ongeldige downloadlink.',
      kind: 'generic',
    };
  }

  const ver = targetVersion.trim();
  if (ver) {
    writeAndroidBetaInstallStarted(ver);
    dispatchInstallPersistChanged();
  }

  let progressHandle: Awaited<ReturnType<typeof FileTransfer.addListener>> | undefined;

  try {
    onPhase('downloading', 0);

    try {
      await Filesystem.mkdir({
        directory: Directory.Cache,
        path: 'updates',
        recursive: true,
      });
    } catch {
      /* bestaat al */
    }

    await deleteCachedApkBestEffort();

    const dest = await Filesystem.getUri({
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
    });

    progressHandle = await FileTransfer.addListener('progress', (ev) => {
      if (ev.type !== 'download' || !ev.lengthComputable || ev.contentLength <= 0) return;
      const pct = Math.min(100, Math.round((100 * ev.bytes) / ev.contentLength));
      onPhase('downloading', pct);
    });

    const downloadTask = FileTransfer.downloadFile({
      url: apkUrl,
      path: dest.uri,
      progress: true,
    });

    await new Promise<void>((resolve, reject) => {
      const to = window.setTimeout(() => {
        reject(new Error('download_timeout'));
      }, DOWNLOAD_TIMEOUT_MS);
      downloadTask
        .then(() => {
          window.clearTimeout(to);
          resolve();
        })
        .catch((err) => {
          window.clearTimeout(to);
          reject(err);
        });
    });

    onPhase('preparing');
    const uriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
    });

    onPhase('opening');
    await HomecheffApkInstaller.openPackageInstaller({ uri: uriResult.uri });
    writeAndroidBetaInstallerOpened();
    dispatchInstallPersistChanged();
    onPhase('done');
    return { ok: true };
  } catch (e: unknown) {
    const kind = classifyApkInstallError(e);
    const msg = e instanceof Error ? e.message : 'Onbekende fout';
    onPhase('error');
    await deleteCachedApkBestEffort();
    return {
      ok: false,
      fallbackToBrowser: true,
      message: msg,
      kind,
    };
  } finally {
    if (progressHandle) {
      try {
        await progressHandle.remove();
      } catch {
        /* ignore */
      }
    }
    try {
      await FileTransfer.removeAllListeners();
    } catch {
      /* ignore */
    }
  }
}
