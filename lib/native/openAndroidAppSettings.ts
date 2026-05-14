import { isNativeApp } from "@/lib/native/capacitor";

/** Moet matchen met android defaultConfig applicationId / capacitor appId. */
const ANDROID_PACKAGE = "eu.homecheff.mobile";

/**
 * Opent Android app-detailinstellingen (meldingen per app zijn daar te vinden).
 * Werkt in Capacitor WebView via intent-URL.
 */
export function openAndroidAppDetailSettings(): void {
  if (typeof window === "undefined" || !isNativeApp()) return;
  try {
    const data = encodeURIComponent(`package:${ANDROID_PACKAGE}`);
    window.location.href = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=${data};end`;
  } catch {
    /* ignore */
  }
}
