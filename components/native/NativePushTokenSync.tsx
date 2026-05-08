"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { getNativeFcmTokenWhenAlreadyGranted } from "@/lib/native/push";
import { waitUntilNativePushSyncHoldReleased } from "@/lib/native/pushIntroStorage";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";

/**
 * Synchroniseert FCM-token naar de server als:
 * - Capacitor native shell, en
 * - gebruiker ingelogd is, en
 * - push-permissie al granted is (geen prompt).
 *
 * Gebruikers die permissie pas via de debug-knop geven, krijgen server-registratie
 * via die knop (GeoFeed) na token-ontvangst.
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
      void registerFcmTokenWithServer(token, "android");
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [nativeMounted, status, userId]);

  return null;
}
