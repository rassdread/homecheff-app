/**
 * Capacitor / native shell detection for client-side code only.
 * Geen imports van @capacitor/* — veilig voor Next.js SSR en bundling.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (
      window as Window & {
        Capacitor?: { isNativePlatform?: () => boolean };
      }
    ).Capacitor;
    return cap?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/**
 * Capacitor Android WebView (geen @capacitor/core import — SSR-safe).
 * `androidBridge` wordt door de native Android WebView gezet vóór/during load — betrouwbaarder
 * dan alleen `Capacitor.getPlatform()` als timing/race met de JS-bundle voorkomt.
 */
export function isNativeAndroid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as Window & {
      androidBridge?: unknown;
      Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
    };
    if (w.androidBridge != null) return true;
    if (w.Capacitor?.getPlatform?.() === "android") return true;
    return false;
  } catch {
    return false;
  }
}

/** Harde Android WebView-detectie (zelfde als `useAndroidBridgePresent` snapshot). */
export function isAndroidWebViewBridgePresent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!(window as unknown as { androidBridge?: unknown }).androidBridge;
  } catch {
    return false;
  }
}
