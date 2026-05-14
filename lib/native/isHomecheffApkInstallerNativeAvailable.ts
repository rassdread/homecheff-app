import { Capacitor } from '@capacitor/core';

/**
 * True when the native HomeCheff APK installer Capacitor plugin is registered.
 * Release (Play Store) builds omit the plugin; calling it would throw.
 */
export function isHomecheffApkInstallerNativeAvailable(): boolean {
  return (
    Capacitor.getPlatform() === 'android' &&
    Capacitor.isPluginAvailable('HomecheffApkInstaller')
  );
}
