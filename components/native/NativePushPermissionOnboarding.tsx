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
  nativePushDevLog,
  requestAndRegisterNativePush,
  getNativePushPermissionState,
} from "@/lib/native/push";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";

const GATE_KEY = "hc_npush_gate";

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
    nativePushDevLog("onboarding mounted", {
      nativeMounted,
      status,
      hasUserId: Boolean(userId),
      pathname,
    });
  }, [nativeMounted, status, userId, pathname]);

  useEffect(() => {
    if (open) {
      nativePushDevLog("onboarding visible");
    }
  }, [open]);

  useEffect(() => {
    if (!nativeMounted) return;
    if (status !== "authenticated" || !userId) return;
    if (!shouldOfferPushIntroAuto(userId)) {
      nativePushDevLog("skip: intro already finished for user", userId);
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

    nativePushDevLog("evaluate open conditions", {
      gate,
      welcome,
      onMessages,
      onProfileShell,
    });

    if (!gate && !welcome && !onMessages && !onProfileShell) return;

    void getNativePushPermissionState().then((perm) =>
      nativePushDevLog("permission snapshot (pre-modal)", perm)
    );

    const tmr = window.setTimeout(() => {
      if (shownRef.current) return;
      shownRef.current = true;
      try {
        sessionStorage.removeItem(GATE_KEY);
      } catch {
        /* ignore */
      }
      nativePushDevLog("opening explainer modal");
      setOpen(true);
    }, 900);

    return () => window.clearTimeout(tmr);
  }, [nativeMounted, status, userId, pathname, searchParams]);

  const handleLater = () => {
    nativePushDevLog("intro dismissed (later)");
    if (userId) markPushIntroFinished(userId);
    setOpen(false);
  };

  const handleEnable = async () => {
    if (!userId || busy) return;
    setBusy(true);
    nativePushDevLog("enable tapped → permission + register chain");
    try {
      const token = await requestAndRegisterNativePush();
      const platform =
        Capacitor.getPlatform() === "ios" ? "ios" : "android";
      nativePushDevLog("server register started", { platform });
      const reg = await registerFcmTokenWithServer(token, platform);
      nativePushDevLog("server register result", reg);
      if (reg !== "ok") {
        alert(t("nativePush.registerError"));
      } else {
        try {
          const prefRes = await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pushNewMessages: true }),
          });
          nativePushDevLog("preferences update result", prefRes.status);
        } catch (prefErr) {
          nativePushDevLog("preferences update failed (non-fatal)", prefErr);
        }
      }
    } catch (e) {
      nativePushDevLog("enable flow error (caught)", e);
      const msg =
        e instanceof NativePushError
          ? e.message
          : t("nativePush.registerError");
      alert(msg);
    } finally {
      try {
        markPushIntroFinished(userId);
      } catch {
        /* ignore */
      }
      nativePushDevLog("onboarding finished (closing UI)");
      setBusy(false);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
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
