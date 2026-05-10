'use client';

/**
 * Opent een URL buiten de WebView waar mogelijk (Capacitor Browser), anders window.open.
 * Geen stille APK-installatie — alleen doorverwijzen naar download/browser.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window === 'undefined' || !url) return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  } catch {
    /* @capacitor/browser niet geïnstalleerd of WebView: fallback */
  }
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    window.location.href = url;
  }
}
