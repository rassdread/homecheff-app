"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { isNativeApp } from "@/lib/native/capacitor";
import { writeNativeShellLastPath } from "@/lib/native/appShellStorage";
import { isSafeRestorablePath } from "@/lib/native/safeRoute";
import {
  consumePendingNativeRoute,
  pathFromPushNotificationData,
  storePendingNativeRoute,
} from "@/lib/native/pushDeepLink";
import { touchNativePrefsUser } from "@/lib/native/appPreferences";

const WARM_ROUTES = [
  "/",
  "/messages/",
  "/profile/",
  "/verkoper/dashboard/",
] as const;

function NativeOfflineOverlay() {
  const nativeMounted = useIsNativeAppMounted();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (!nativeMounted) return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [nativeMounted]);

  if (!nativeMounted || online) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/95 px-6 text-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <p className="text-gray-800 text-base font-medium max-w-sm">
        Geen verbinding. Controleer je internet en probeer opnieuw.
      </p>
      <button
        type="button"
        className="mt-5 rounded-xl bg-emerald-600 text-white font-semibold px-6 py-3"
        onClick={() => window.location.reload()}
      >
        Opnieuw proberen
      </button>
    </div>
  );
}

function NativeWarmTabPrefetch() {
  const nativeMounted = useIsNativeAppMounted();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (!nativeMounted || didRun.current) return;
    didRun.current = true;

    const run = () => {
      for (const href of WARM_ROUTES) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore */
        }
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      window.setTimeout(run, 1800);
    }
  }, [nativeMounted, router]);

  return null;
}

function NativeLastRouteTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const nativeMounted = useIsNativeAppMounted();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  useEffect(() => {
    if (!nativeMounted || status !== "authenticated" || !userId) return;
    touchNativePrefsUser(userId);
  }, [nativeMounted, status, userId]);

  useEffect(() => {
    if (!nativeMounted || !pathname) return;
    if (status === "loading") return;
    if (!isSafeRestorablePath(pathname)) return;
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/admin")
    )
      return;
    writeNativeShellLastPath(pathname, userId);
  }, [nativeMounted, pathname, status, userId]);

  return null;
}

function NativePendingRouteApplier() {
  const router = useRouter();
  const nativeMounted = useIsNativeAppMounted();
  const applied = useRef(false);

  useEffect(() => {
    if (!nativeMounted || applied.current) return;
    if (!isNativeApp()) return;
    const path = consumePendingNativeRoute();
    if (!path) return;
    applied.current = true;
    try {
      router.replace(path);
    } catch {
      window.location.assign(path);
    }
  }, [nativeMounted, router]);

  return null;
}

function NativePushDeepLinkListener() {
  const router = useRouter();
  const nativeMounted = useIsNativeAppMounted();
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!nativeMounted) return;

    let cancelled = false;

    void (async () => {
      if (!isNativeApp()) return;
      try {
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );
        const handle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (event) => {
            const data = event.notification?.data as
              | Record<string, unknown>
              | undefined;
            const path = pathFromPushNotificationData(data);
            if (!path) return;
            storePendingNativeRoute(path);
            try {
              router.replace(path);
            } catch {
              window.location.assign(path);
            }
          }
        );
        if (cancelled) {
          await handle.remove();
          return;
        }
        cleanupRef.current = async () => {
          try {
            await handle.remove();
          } catch {
            /* ignore */
          }
        };
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      void cleanupRef.current?.();
    };
  }, [nativeMounted, router]);

  return null;
}

/**
 * Native Android: route persistence, prefetch, offline overlay, push deep links.
 */
export default function NativeAppUxFoundation() {
  return (
    <>
      <NativeLastRouteTracker />
      <NativeWarmTabPrefetch />
      <NativePendingRouteApplier />
      <NativePushDeepLinkListener />
      <NativeOfflineOverlay />
    </>
  );
}
