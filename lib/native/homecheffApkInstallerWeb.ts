import { WebPlugin } from '@capacitor/core';

export class HomecheffApkInstallerWeb extends WebPlugin {
  constructor() {
    super({ name: 'HomecheffApkInstaller', platforms: ['web'] });
  }

  async openPackageInstaller(): Promise<void> {
    throw new Error('HomecheffApkInstaller is only available on Android native');
  }
}
