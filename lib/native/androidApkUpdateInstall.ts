'use client';

import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  HomecheffApkInstaller,
  type CopyCachedApkToDownloadsResult,
} from '@/lib/native/homecheffApkInstaller';
import {
  writeAndroidBetaInstallStarted,
  writeAndroidBetaInstallerOpened,
} from '@/lib/native/android-beta-install-state';
import { shouldLogAppUpdateDebug } from '@/lib/app-update-debug';

/** Relatief pad onder {@link Directory.Cache}; moet matchen met FileProvider `cache-path`. */
export const ANDROID_BETA_CACHE_APK_RELATIVE_PATH = 'updates/homecheff-beta.apk';

/** Bestandsnaam in gebruikers-Downloads / HomeCheff-map. */
export const ANDROID_BETA_EXPORT_APK_FILE_NAME = 'homecheff-beta.apk';

const CACHE_APK_PATH = ANDROID_BETA_CACHE_APK_RELATIVE_PATH;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

const LS_LAST_FAILURE = 'hc_apk_last_native_failure';

function logApk(stage: string, data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const on =
    shouldLogAppUpdateDebug() || process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL === 'true';
  if (!on) return;
  console.info('[apk-native-install]', stage, data);
}

function storeFailure(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      LS_LAST_FAILURE,
      JSON.stringify({ t: Date.now(), ...payload }),
    );
  } catch {
    /* ignore */
  }
}

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
      /** True only when user should try browser as last resort — never auto-open. */
      fallbackToBrowser: boolean;
      message: string;
      kind: ApkInstallFailureKind;
      /** Chain of what failed (for support / debug UI). */
      fallbackReason: string;
      /** Installer faalde ná download; APK kan nog in cache staan (retry zonder opnieuw te downloaden). */
      cachedApkMayExist?: boolean;
    };

function parseCopyCachedApkResult(raw: unknown): CopyCachedApkToDownloadsResult {
  if (!raw || typeof raw !== 'object') {
    return { success: false, reason: 'invalid_response' };
  }
  const o = raw as Record<string, unknown>;
  if (o.success === true && typeof o.displayPath === 'string' && typeof o.uri === 'string') {
    return {
      success: true,
      displayPath: o.displayPath,
      uri: o.uri,
      method: typeof o.method === 'string' ? o.method : 'unknown',
    };
  }
  return {
    success: false,
    reason: typeof o.reason === 'string' ? o.reason : 'copy_failed',
  };
}

/** Cache-APK naar Downloads (MediaStore / public map / app-external), voor zichtbare fallback. */
export async function copyCachedBetaApkToDownloads(): Promise<CopyCachedApkToDownloadsResult> {
  const raw = await HomecheffApkInstaller.copyCachedApkToDownloads({
    cacheRelativePath: CACHE_APK_PATH,
    fileName: ANDROID_BETA_EXPORT_APK_FILE_NAME,
  });
  const parsed = parseCopyCachedApkResult(raw);
  if (shouldLogAppUpdateDebug() || process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL === 'true') {
    console.info('[apk-installer]', 'copy_to_downloads_ts', parsed);
  }
  return parsed;
}

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

function capErrorDetail(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message?: string }).message ?? e);
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * Download APK naar app-cache (Filesystem.downloadFile → echt pad op Android) en start ACTION_VIEW.
 *
 * Belangrijk: {@link @capacitor/file-transfer} verwacht een **filesystem path**, geen `content://`-URI
 * van {@link Filesystem.getUri}. Die mismatch deed de download falen → {@link openExternalUrl} → Chrome/Browser.
 */
export async function downloadApkAndOpenInstaller(
  apkUrl: string,
  targetVersion: string,
  onPhase: (phase: ApkInstallPhase, progressPct?: number) => void,
): Promise<ApkInstallResult> {
  if (!apkUrl || !/^https:\/\//i.test(apkUrl)) {
    const reason = 'invalid_apk_url_not_https';
    storeFailure({ stage: 'precheck', reason });
    logApk('precheck-fail', { reason, apkUrlPrefix: apkUrl?.slice(0, 32) });
    return {
      ok: false,
      fallbackToBrowser: true,
      message: 'Ongeldige downloadlink.',
      kind: 'generic',
      fallbackReason: reason,
    };
  }

  const ver = targetVersion.trim();
  if (ver) {
    writeAndroidBetaInstallStarted(ver);
    dispatchInstallPersistChanged();
  }

  logApk('start', {
    apkUrlHost: (() => {
      try {
        return new URL(apkUrl).host;
      } catch {
        return 'parse_error';
      }
    })(),
    cachePath: CACHE_APK_PATH,
    targetVersion: ver || '(none)',
  });

  let progressListener: { remove: () => Promise<void> } | undefined;

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

    try {
      progressListener = await Filesystem.addListener(
        'progress',
        (info: { bytes?: number; contentLength?: number; url?: string }) => {
          const bytes = info.bytes ?? 0;
          const cl = info.contentLength ?? 0;
          if (cl > 0) {
            onPhase('downloading', Math.min(100, Math.round((100 * bytes) / cl)));
          }
        },
      );
    } catch (listenErr) {
      logApk('progress-listener-skip', { detail: capErrorDetail(listenErr) });
    }

    logApk('download-start', {
      method: 'Filesystem.downloadFile',
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
      timeoutsMs: DOWNLOAD_TIMEOUT_MS,
    });

    await Filesystem.downloadFile({
      url: apkUrl,
      path: CACHE_APK_PATH,
      directory: Directory.Cache,
      progress: true,
      connectTimeout: DOWNLOAD_TIMEOUT_MS,
      readTimeout: DOWNLOAD_TIMEOUT_MS,
      method: 'GET',
    });

    logApk('download-success', { path: CACHE_APK_PATH });

    onPhase('preparing');
    let probeUri: string | undefined;
    try {
      const u = await Filesystem.getUri({
        directory: Directory.Cache,
        path: CACHE_APK_PATH,
      });
      probeUri = u.uri;
      logApk('getUri-probe', {
        uriScheme: probeUri?.split(':')[0] ?? '(empty)',
        uriLen: probeUri?.length ?? 0,
        uriSample: probeUri?.slice(0, 120),
      });
    } catch (probeErr) {
      logApk('getUri-probe-skip', { detail: capErrorDetail(probeErr) });
    }

    onPhase('opening');
    try {
      if (shouldLogAppUpdateDebug() || process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL === 'true') {
        console.info('[apk-installer]', 'ts_invoke', {
          cacheRelativePath: CACHE_APK_PATH,
          probeUriScheme: probeUri?.split(':')[0],
        });
      }
      await HomecheffApkInstaller.openDownloadedApkFromCache({
        cacheRelativePath: CACHE_APK_PATH,
      });
    } catch (installerErr) {
      const msg = capErrorDetail(installerErr);
      const kind = classifyApkInstallError(installerErr);
      const reason = `installer_plugin:${msg}`;
      storeFailure({
        stage: 'openDownloadedApkFromCache',
        reason,
        message: msg,
        cacheRelativePath: CACHE_APK_PATH,
        probeUri: probeUri?.slice(0, 200),
      });
      logApk('installer-fail', { message: msg, kind });
      onPhase('error');
      return {
        ok: false,
        fallbackToBrowser: kind !== 'unknown_sources',
        message: msg,
        kind,
        fallbackReason: reason,
        cachedApkMayExist: true,
      };
    }

    writeAndroidBetaInstallerOpened();
    dispatchInstallPersistChanged();
    onPhase('done');
    logApk('complete', { installerOpened: true });
    try {
      sessionStorage.removeItem(LS_LAST_FAILURE);
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e: unknown) {
    const kind = classifyApkInstallError(e);
    const msg = capErrorDetail(e);
    const reason = `download_or_prepare:${msg}`;
    storeFailure({ stage: 'download', reason, message: msg, kind });
    logApk('error', { kind, message: msg });
    onPhase('error');
    await deleteCachedApkBestEffort();
    return {
      ok: false,
      fallbackToBrowser: true,
      message: msg,
      kind,
      fallbackReason: reason,
    };
  } finally {
    if (progressListener) {
      try {
        await progressListener.remove();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Opent alleen de installer voor de reeds gedownloade APK in cache (geen netwerk).
 * Gebruik na een mislukte install-stap zolang het bestand nog bestaat.
 */
export async function openCachedApkInstallerOnly(
  targetVersion: string,
  onPhase: (phase: ApkInstallPhase, progressPct?: number) => void,
): Promise<ApkInstallResult> {
  const ver = targetVersion.trim();
  if (ver) {
    writeAndroidBetaInstallStarted(ver);
    dispatchInstallPersistChanged();
  }

  logApk('retry-cached-start', { cachePath: CACHE_APK_PATH });

  try {
    onPhase('preparing');
    onPhase('opening');
    if (shouldLogAppUpdateDebug() || process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL === 'true') {
      console.info('[apk-installer]', 'ts_retry_cached', { cacheRelativePath: CACHE_APK_PATH });
    }
    await HomecheffApkInstaller.openDownloadedApkFromCache({
      cacheRelativePath: CACHE_APK_PATH,
    });
    writeAndroidBetaInstallerOpened();
    dispatchInstallPersistChanged();
    onPhase('done');
    logApk('retry-cached-complete', { installerOpened: true });
    try {
      sessionStorage.removeItem(LS_LAST_FAILURE);
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e: unknown) {
    const kind = classifyApkInstallError(e);
    const msg = capErrorDetail(e);
    const reason = `retry_cached_installer:${msg}`;
    storeFailure({ stage: 'openCachedApk', reason, message: msg });
    logApk('retry-cached-fail', { kind, message: msg });
    onPhase('error');
    const missing =
      msg.toLowerCase().includes('apk_not_found') ||
      msg.toLowerCase().includes('cached apk missing');
    return {
      ok: false,
      fallbackToBrowser: kind !== 'unknown_sources',
      message: msg,
      kind,
      fallbackReason: reason,
      cachedApkMayExist: !missing,
    };
  }
}
