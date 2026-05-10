import { registerPlugin } from '@capacitor/core';

export interface HomecheffApkInstallerPlugin {
  openPackageInstaller(options: { uri: string }): Promise<void>;
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
