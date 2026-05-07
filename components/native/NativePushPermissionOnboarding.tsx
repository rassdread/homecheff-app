"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Bell, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import {
  markPushIntroFinished,
  shouldOfferPushIntroAuto,
} from "@/lib/native/pushIntroStorage";
import {
  NativePushError,
  requestAndRegisterNativePush,
  getNativePushPermissionState,
} from "@/lib/native/push";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";

const GATE_KEY = "hc_npush_gate";

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[hc-native-push-onboarding]", ...args);
  }
}

/**
 * Eén keer na login (native gate / welcome= URL) of bij eerste bezoek aan Berichten of Profiel (native):
 * eigen uitleg → daarna OS-permissie + FCM + POST /api/push/register.
 */
export default function NativePushPermissionOnboarding() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nativeMounted = useIsNativeAppMounted();
  const { t } = useTranslation();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    devLog("mounted", { nativeMounted, status, userId, pathname });
  }, [nativeMounted, status, userId, pathname]);

  useEffect(() => {
    if (!nativeMounted) return;
    if (status !== "authenticated" || !userId) return;
    if (!shouldOfferPushIntroAuto(userId)) {
      devLog("skip: intro already finished for user", userId);
      return;
    }

    let gate = false;
    try {
      gate = sessionStorage.getItem(GATE_KEY) === "1";
    } catch {
      /* ignore */
    }

    const welcome =
      searchParams?.get("welcome") === "true" ||
      searchParams?.get("native_push") === "1";

    const onMessages =
      typeof pathname === "string" && pathname.startsWith("/messages");

    const onProfileShell =
      typeof pathname === "string" && pathname.startsWith("/profile");

    devLog("evaluate", {
      gate,
      welcome,
      onMessages,
      onProfileShell,
      search: typeof window !== "undefined" ? window.location.search : "",
    });

    if (!gate && !welcome && !onMessages && !onProfileShell) return;

    void getNativePushPermissionState().then((perm) =>
      devLog("permission snapshot", perm)
    );

    const tmr = window.setTimeout(() => {
      if (shownRef.current) return;
      shownRef.current = true;
      try {
        sessionStorage.removeItem(GATE_KEY);
      } catch {
        /* ignore */
      }
      devLog("opening explainer modal");
      setOpen(true);
    }, 900);

    return () => window.clearTimeout(tmr);
  }, [nativeMounted, status, userId, pathname, searchParams]);

  const handleLater = () => {
    devLog("intro dismissed (later)");
    if (userId) markPushIntroFinished(userId);
    setOpen(false);
  };

  const handleEnable = async () => {
    if (!userId || busy) return;
    setBusy(true);
    devLog("enable tapped → OS prompt");
    try {
      const token = await requestAndRegisterNativePush();
      const platform =
        Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const reg = await registerFcmTokenWithServer(token, platform);
      if (reg !== "ok") {
        alert(t("nativePush.registerError"));
      } else {
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pushNewMessages: true }),
        }).catch(() => {});
      }
    } catch (e) {
      const msg =
        e instanceof NativePushError
          ? e.message
          : t("nativePush.registerError");
      alert(msg);
    } finally {
      markPushIntroFinished(userId);
      devLog("intro finished after attempt");
      setBusy(false);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[245] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleLater();
      }}
    >
      <div
        className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="native-push-intro-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Bell className="h-6 w-6 text-emerald-700" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="native-push-intro-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t("nativePush.introTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {t("nativePush.introBody")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label={t("common.close")}
            onClick={handleLater}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleEnable()}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? t("common.sending") : t("nativePush.turnOn")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleLater}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            {t("nativePush.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
