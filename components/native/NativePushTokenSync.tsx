"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import {
  getNativeFcmTokenWhenAlreadyGranted,
  getNativePushPermissionState,
} from "@/lib/native/push";
import {
  markPushIntroFinished,
  waitUntilNativePushSyncHoldReleased,
} from "@/lib/native/pushIntroStorage";
import { getOrCreatePushDeviceId } from "@/lib/native/pushClientPrefs";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";
import { getCapacitorAppInfo } from "@/lib/native/getCapacitorAppInfo";
import { reportAppDiagnostic } from "@/lib/diagnostics/appDiagnostics";
import { isNativeApp } from "@/lib/native/capacitor";
import { maskPushTokenForDisplay, nativePushDevLog } from "@/lib/native/push";
import { refreshCommsAfterNativePush } from "@/lib/native/pushCommsRefresh";

/**
 * Stille FCM-sync (native): geen OS-permissieprompt.
 * Alleen als permissie al granted is → register() + POST /api/push/register (met throttle).
 * Na app-update: zelfde token wordt opnieuw naar de server gestuurd (semver-bypass in throttle).
 */
export default function NativePushTokenSync() {
  const { data: session, status } = useSession();
  const nativeMounted = useIsNativeAppMounted();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const lastPermDiagRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nativeMounted) return;
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;

    const pushToServer = async (opts: {
      force: boolean;
      diagReason: "mount" | "resume" | "post_update" | "token_refresh";
    }) => {
      try {
        await waitUntilNativePushSyncHoldReleased();
        if (cancelled) return;

        const perm = await getNativePushPermissionState();
        if (lastPermDiagRef.current !== perm) {
          lastPermDiagRef.current = perm;
          reportAppDiagnostic("push_permission_status", { state: perm });
        }

        const appInfo = await getCapacitorAppInfo();
        const appVersion = appInfo.version;

        const token = await getNativeFcmTokenWhenAlreadyGranted();
        if (cancelled || !token) return;

        let platform: "android" | "ios" = "android";
        try {
          const { Capacitor } = await import("@capacitor/core");
          platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
        } catch {
          platform = "android";
        }

        const deviceId = getOrCreatePushDeviceId();

        const reg = await registerFcmTokenWithServer(token, platform, deviceId, {
          force: opts.force,
          appVersion,
          diagReason: opts.diagReason,
        });
        if (cancelled) return;
        if (reg === "ok") {
          try {
            markPushIntroFinished(userId);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* push sync must never surface as an app-level error */
      }
    };

    void pushToServer({ force: false, diagReason: "mount" });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      refreshCommsAfterNativePush("resume");
      void pushToServer({ force: true, diagReason: "resume" });
    };

    const onPostUpdate = () => {
      void pushToServer({ force: true, diagReason: "post_update" });
    };

    document.addEventListener("visibilitychange", onVisible);
    if (typeof window !== "undefined" && isNativeApp()) {
      window.addEventListener("hc-apk-install-success-for-push", onPostUpdate);
    }

    let regListener: { remove: () => Promise<void> } | null = null;
    let appStateListener: { remove: () => Promise<void> } | null = null;

    void (async () => {
      if (!isNativeApp() || cancelled) return;
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        regListener = await PushNotifications.addListener(
          "registration",
          ({ value }) => {
            if (cancelled || !value) return;
            nativePushDevLog(
              "FCM token refresh",
              maskPushTokenForDisplay(value),
            );
            reportAppDiagnostic("push_token_refresh", {});
            void pushToServer({ force: true, diagReason: "token_refresh" });
          },
        );
      } catch {
        /* ignore */
      }

      try {
        const { App } = await import("@capacitor/app");
        appStateListener = await App.addListener("appStateChange", ({ isActive }) => {
          if (cancelled || !isActive) return;
          refreshCommsAfterNativePush("resume");
          void pushToServer({ force: true, diagReason: "resume" });
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "hc-apk-install-success-for-push",
          onPostUpdate
        );
      }
      void regListener?.remove();
      void appStateListener?.remove();
    };
  }, [nativeMounted, status, userId]);

  return null;
}
