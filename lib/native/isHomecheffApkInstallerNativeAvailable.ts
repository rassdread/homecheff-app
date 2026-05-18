import { Capacitor } from '@capacitor/core';

/**
 * True when the native HomeCheff APK installer Capacitor plugin is registered (Android release + debug).
 */
export function isHomecheffApkInstallerNativeAvailable(): boolean {
  return (
    Capacitor.getPlatform() === 'android' &&
    Capacitor.isPluginAvailable('HomecheffApkInstaller')
  );
}
