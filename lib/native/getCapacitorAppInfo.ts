export type CapacitorAppInfo = {
  version: string | null;
  build: string | null;
};

/**
 * Capacitor App.getInfo() indien beschikbaar; anders null (geen throw).
 * Dynamic import zodat SSR/bundling zonder native plugin niet breekt.
 */
export async function getCapacitorAppInfo(): Promise<CapacitorAppInfo> {
  if (typeof window === 'undefined') {
    return { version: null, build: null };
  }
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const version =
      typeof info.version === 'string' && info.version.trim() ? info.version.trim() : null;
    const build =
      info.build != null && String(info.build).trim() ? String(info.build).trim() : null;
    return { version, build };
  } catch {
    return { version: null, build: null };
  }
}
