'use client';

import { useEffect, useState } from 'react';
import { useGoogleLoginUiMode } from '@/lib/native/useGoogleLoginUiMode';
import { useAndroidBridgePresent } from '@/lib/native/useAndroidBridgePresent';
import { isNativeAndroid } from '@/lib/native/capacitor';

const SKELETON_MAX_MS = 2500;

/**
 * Avoid infinite skeleton when `googleLoginMode` stays `pending` before native shell is ready.
 */
export function useGoogleLoginUiResolved(): {
  showSkeleton: boolean;
  showNativeButton: boolean;
  showWebButton: boolean;
} {
  const googleLoginMode = useGoogleLoginUiMode();
  const androidBridgePresent = useAndroidBridgePresent();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), SKELETON_MAX_MS);
    return () => window.clearTimeout(t);
  }, []);

  const nativeLikely =
    androidBridgePresent ||
    googleLoginMode === 'android_native' ||
    (timedOut && typeof window !== 'undefined' && isNativeAndroid());

  const pendingShell = !androidBridgePresent && googleLoginMode === 'pending' && !timedOut;

  return {
    showSkeleton: pendingShell,
    showNativeButton: nativeLikely,
    showWebButton: !nativeLikely && googleLoginMode === 'web',
  };
}
