import { registerPlugin } from '@capacitor/core';

export type OpenPackageInstallerOptions = {
  /** Prefer this: pad t.o.v. app cache (matcht FileProvider + downloadFile CACHE). */
  cacheRelativePath?: string;
  /** Legacy: Capacitor Filesystem URI; file:// wordt in native omgezet naar FileProvider. */
  uri?: string;
};

export interface HomecheffApkInstallerPlugin {
  openPackageInstaller(options: OpenPackageInstallerOptions): Promise<void>;
  openManageUnknownAppSources(): Promise<void>;
  openSystemDownloads(): Promise<void>;
}

/** Alleen Android native; Web bundelt stub (no-op). */
export const HomecheffApkInstaller = registerPlugin<HomecheffApkInstallerPlugin>(
  'HomecheffApkInstaller',
  {
    web: () =>
      import('./homecheffApkInstallerWeb').then((m) => new m.HomecheffApkInstallerWeb()),
  }
);
