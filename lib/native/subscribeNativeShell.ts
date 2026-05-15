/**
 * Reactive native-shell detection for Capacitor Android WebView.
 * `androidBridge` / Capacitor are often injected after the first React paint;
 * hooks must re-render when they become available.
 */

import { isAndroidWebViewBridgePresent, isNativeAndroid } from '@/lib/native/capacitor';

const POLL_MS = 100;
const POLL_MAX_MS = 4000;

export function subscribeNativeShell(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  onStoreChange();

  const started = Date.now();
  const id = window.setInterval(() => {
    onStoreChange();
    if (Date.now() - started >= POLL_MAX_MS) {
      window.clearInterval(id);
    }
  }, POLL_MS);

  const onVisible = () => onStoreChange();
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export function readNativeShellSnapshot(): {
  androidBridge: boolean;
  nativeAndroid: boolean;
} {
  if (typeof window === 'undefined') {
    return { androidBridge: false, nativeAndroid: false };
  }
  return {
    androidBridge: isAndroidWebViewBridgePresent(),
    nativeAndroid: isNativeAndroid(),
  };
}

export function shouldUseNativeGoogleLogin(snapshot: {
  androidBridge: boolean;
  nativeAndroid: boolean;
}): boolean {
  return snapshot.androidBridge || snapshot.nativeAndroid;
}
