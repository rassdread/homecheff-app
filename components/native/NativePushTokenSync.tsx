"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { getNativeFcmTokenWhenAlreadyGranted } from "@/lib/native/push";
import {
  markPushIntroFinished,
  waitUntilNativePushSyncHoldReleased,
} from "@/lib/native/pushIntroStorage";
import { getOrCreatePushDeviceId } from "@/lib/native/pushClientPrefs";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";

/**
 * Stille FCM-sync (native): geen OS-permissieprompt.
 * Alleen als permissie al granted is → register() + POST /api/push/register (met throttle).
 */
export default function NativePushTokenSync() {
  const { data: session, status } = useSession();
  const nativeMounted = useIsNativeAppMounted();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  useEffect(() => {
    if (!nativeMounted) return;
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;

    const run = async () => {
      await waitUntilNativePushSyncHoldReleased();
      if (cancelled) return;
      const token = await getNativeFcmTokenWhenAlreadyGranted();
      if (cancelled || !token) return;

      const { Capacitor } = await import("@capacitor/core");
      const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const deviceId = getOrCreatePushDeviceId();

      const reg = await registerFcmTokenWithServer(token, platform, deviceId);
      if (cancelled) return;
      if (reg === "ok") {
        try {
          markPushIntroFinished(userId);
        } catch {
          /* ignore */
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [nativeMounted, status, userId]);

  return null;
}
