import { registerPlugin } from '@capacitor/core';

export type OpenPackageInstallerOptions = {
  /** Prefer this: pad t.o.v. app cache (matcht FileProvider + downloadFile CACHE). */
  cacheRelativePath?: string;
  /** Legacy: Capacitor Filesystem URI; file:// wordt in native omgezet naar FileProvider. */
  uri?: string;
};

export type CopyCachedApkToDownloadsResult =
  | { success: true; displayPath: string; uri: string; method: string }
  | { success: false; reason: string };

export type AndroidInstallSourceResult = {
  installerPackageName: string;
  isPlayStoreInstall: boolean;
  isSideloadInstall: boolean;
};

export interface HomecheffApkInstallerPlugin {
  openPackageInstaller(options: OpenPackageInstallerOptions): Promise<void>;
  /** Expliciete cache → installer (zelfde als openPackageInstaller met cacheRelativePath). */
  openDownloadedApkFromCache(options: { cacheRelativePath: string }): Promise<void>;
  copyCachedApkToDownloads(options: {
    cacheRelativePath: string;
    fileName?: string;
  }): Promise<Record<string, unknown>>;
  openManageUnknownAppSources(): Promise<void>;
  openSystemDownloads(): Promise<void>;
  /** Play Store vs sideload install detection (Android native only). */
  getInstallSource(): Promise<AndroidInstallSourceResult>;
}

/** Alleen Android native; Web bundelt stub (no-op). */
export const HomecheffApkInstaller = registerPlugin<HomecheffApkInstallerPlugin>(
  'HomecheffApkInstaller',
  {
    web: () =>
      import('./homecheffApkInstallerWeb').then((m) => new m.HomecheffApkInstallerWeb()),
  }
);
