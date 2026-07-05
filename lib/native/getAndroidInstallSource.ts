'use client';

import { isNativeAndroid } from '@/lib/native/capacitor';
import { HomecheffApkInstaller } from '@/lib/native/homecheffApkInstaller';
import { isHomecheffApkInstallerNativeAvailable } from '@/lib/native/isHomecheffApkInstallerNativeAvailable';

export type AndroidInstallSource = {
  installerPackageName: string | null;
  isPlayStoreInstall: boolean;
  isSideloadInstall: boolean;
  /** True when install source could not be determined (web, iOS, plugin error). */
  unknown: boolean;
};

const UNKNOWN: AndroidInstallSource = {
  installerPackageName: null,
  isPlayStoreInstall: false,
  isSideloadInstall: false,
  unknown: true,
};

/**
 * Detect whether the native Android app was installed via Google Play or sideload.
 * Never throws — safe for render paths.
 */
export async function getAndroidInstallSource(): Promise<AndroidInstallSource> {
  if (typeof window === 'undefined' || !isNativeAndroid()) {
    return UNKNOWN;
  }
  if (!isHomecheffApkInstallerNativeAvailable()) {
    return {
      installerPackageName: null,
      isPlayStoreInstall: false,
      isSideloadInstall: true,
      unknown: true,
    };
  }
  try {
    const raw = await HomecheffApkInstaller.getInstallSource();
    const installerPackageName = (raw.installerPackageName ?? '').trim() || null;
    return {
      installerPackageName,
      isPlayStoreInstall: Boolean(raw.isPlayStoreInstall),
      isSideloadInstall: Boolean(raw.isSideloadInstall),
      unknown: false,
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getAndroidInstallSource] failed', e);
    }
    return {
      installerPackageName: null,
      isPlayStoreInstall: false,
      isSideloadInstall: true,
      unknown: true,
    };
  }
}
