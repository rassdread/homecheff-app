'use client';

import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { HomecheffApkInstaller } from '@/lib/native/homecheffApkInstaller';

const CACHE_APK_PATH = 'updates/homecheff-beta.apk';

export type ApkInstallPhase =
  | 'idle'
  | 'downloading'
  | 'preparing'
  | 'opening'
  | 'done'
  | 'error';

export type ApkInstallResult =
  | { ok: true }
  | { ok: false; fallbackToBrowser: boolean; message: string };

/**
 * Download APK naar app-cache en start ACTION_VIEW (package installer).
 * Alleen voor Capacitor Android; elders niet aanroepen.
 */
export async function downloadApkAndOpenInstaller(
  apkUrl: string,
  onPhase: (phase: ApkInstallPhase, progressPct?: number) => void
): Promise<ApkInstallResult> {
  if (!apkUrl || !/^https:\/\//i.test(apkUrl)) {
    return { ok: false, fallbackToBrowser: true, message: 'Geen geldige HTTPS-APK-URL.' };
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

    try {
      await Filesystem.deleteFile({
        directory: Directory.Cache,
        path: CACHE_APK_PATH,
      });
    } catch {
      /* bestand bestond niet */
    }

    const dest = await Filesystem.getUri({
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
    });

    progressHandle = await FileTransfer.addListener('progress', (ev) => {
      if (ev.type !== 'download' || !ev.lengthComputable || ev.contentLength <= 0) return;
      const pct = Math.min(100, Math.round((100 * ev.bytes) / ev.contentLength));
      onPhase('downloading', pct);
    });

    await FileTransfer.downloadFile({
      url: apkUrl,
      path: dest.uri,
      progress: true,
    });

    onPhase('preparing');
    const uriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: CACHE_APK_PATH,
    });

    onPhase('opening');
    await HomecheffApkInstaller.openPackageInstaller({ uri: uriResult.uri });
    onPhase('done');
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Onbekende fout';
    onPhase('error');
    return {
      ok: false,
      fallbackToBrowser: true,
      message: msg,
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
