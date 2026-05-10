import { WebPlugin } from '@capacitor/core';

export class HomecheffApkInstallerWeb extends WebPlugin {
  constructor() {
    super({ name: 'HomecheffApkInstaller', platforms: ['web'] });
  }

  async openPackageInstaller(): Promise<void> {
    throw new Error('HomecheffApkInstaller is only available on Android native');
  }

  async openDownloadedApkFromCache(): Promise<void> {
    throw new Error('HomecheffApkInstaller is only available on Android native');
  }

  async copyCachedApkToDownloads(): Promise<Record<string, unknown>> {
    return { success: false, reason: 'not_android' };
  }

  async openManageUnknownAppSources(): Promise<void> {
    throw new Error('HomecheffApkInstaller is only available on Android native');
  }

  async openSystemDownloads(): Promise<void> {
    throw new Error('HomecheffApkInstaller is only available on Android native');
  }
}
