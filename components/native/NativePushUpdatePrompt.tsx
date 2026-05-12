"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Capacitor } from "@capacitor/core";
import { Bell, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { isNativeApp } from "@/lib/native/capacitor";
import { getCapacitorAppInfo } from "@/lib/native/getCapacitorAppInfo";
import {
  NativePushError,
  getNativePushPermissionState,
  requestAndRegisterNativePush,
} from "@/lib/native/push";
import {
  markPushIntroFinished,
  setNativePushSyncHold,
} from "@/lib/native/pushIntroStorage";
import { getOrCreatePushDeviceId } from "@/lib/native/pushClientPrefs";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";
import { openAndroidAppDetailSettings } from "@/lib/native/openAndroidAppSettings";
import {
  consumeNativeBinaryVersionStep,
  getPushPromptDismissedUntil,
  setPushPromptDismissedStandardCooldown,
} from "@/lib/native/pushPromptStorage";

const OPEN_DELAY_MS = 4200;
const POST_UPDATE_EXTRA_DELAY_MS = 900;

/**
 * Rustige uitleg na app-update of semver-stap als OS-meldingen nog niet aan staan.
 * Geen agressieve herhaling: cooldown na “Later”, max. één keer per sessie per versie.
 */
export default function NativePushUpdatePrompt() {
  const { data: session, status } = useSession();
  const nativeMounted = useIsNativeAppMounted();
  const { t } = useTranslation();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const postUpdateRef = useRef(false);
  const shownThisSessionRef = useRef<string | null>(null);

  const tryOpen = useCallback(async () => {
    if (!nativeMounted || !isNativeApp()) return;
    if (status !== "authenticated" || !userId) return;
    if (open || busy) return;

    const perm = await getNativePushPermissionState();
    if (perm === "granted") return;

    const now = Date.now();
    if (getPushPromptDismissedUntil() > now) return;

    const { version } = await getCapacitorAppInfo();
    if (!version?.trim()) return;

    const ver = version.trim();
    const sessionKey = `hc_push_update_prompt_sess_${ver}`;
    try {
      if (sessionStorage.getItem(sessionKey) === "1") return;
    } catch {
      /* ignore */
    }

    const postUpdate = postUpdateRef.current;
    postUpdateRef.current = false;

    const versionBumped = consumeNativeBinaryVersionStep(ver);

    if (!postUpdate && !versionBumped) return;

    if (shownThisSessionRef.current === ver) return;
    shownThisSessionRef.current = ver;

    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* ignore */
    }

    setOpen(true);
  }, [nativeMounted, status, userId, open, busy]);

  const tryOpenRef = useRef(tryOpen);
  tryOpenRef.current = tryOpen;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onApk = () => {
      postUpdateRef.current = true;
      window.setTimeout(() => {
        void tryOpenRef.current?.();
      }, POST_UPDATE_EXTRA_DELAY_MS);
    };
    window.addEventListener("hc-apk-install-success-for-push", onApk);
    return () =>
      window.removeEventListener("hc-apk-install-success-for-push", onApk);
  }, []);

  useEffect(() => {
    if (!nativeMounted || !isNativeApp()) return;
    if (status !== "authenticated" || !userId) return;

    const tmr = window.setTimeout(() => {
      void tryOpen();
    }, OPEN_DELAY_MS);

    return () => window.clearTimeout(tmr);
  }, [nativeMounted, status, userId, tryOpen]);

  const handleLater = () => {
    setPushPromptDismissedStandardCooldown();
    setOpen(false);
  };

  const handleOpenSettings = async () => {
    setPushPromptDismissedStandardCooldown();
    setOpen(false);
    if (Capacitor.getPlatform() === "android") {
      void openAndroidAppDetailSettings();
      return;
    }
    if (Capacitor.getPlatform() === "ios") {
      try {
        const { App } = await import("@capacitor/app");
        await App.openUrl({ url: "app-settings:" });
      } catch {
        /* ignore */
      }
    }
  };

  const handleEnable = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setNativePushSyncHold(true);
    try {
      const token = await requestAndRegisterNativePush();
      const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const deviceId = getOrCreatePushDeviceId();
      const { version } = await getCapacitorAppInfo();
      const reg = await registerFcmTokenWithServer(token, platform, deviceId, {
        force: true,
        appVersion: version,
        diagReason: "post_permission",
      });
      if (reg !== "ok") {
        alert(t("nativePush.registerError"));
      } else {
        try {
          await fetch("/api/notifications/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pushNewMessages: true }),
          });
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      const msg =
        e instanceof NativePushError
          ? e.message
          : t("nativePush.registerError");
      alert(msg);
    } finally {
      setNativePushSyncHold(false);
      try {
        markPushIntroFinished(userId);
      } catch {
        /* ignore */
      }
      setBusy(false);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[295] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleLater();
      }}
    >
      <div
        className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="native-push-update-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Bell className="h-6 w-6 text-emerald-700" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="native-push-update-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t("nativePush.updatePromptTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {t("nativePush.updatePromptBody")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label={t("common.close")}
            onClick={handleLater}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleEnable()}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? t("common.sending") : t("nativePush.enableCta")}
          </button>
          {Capacitor.isNativePlatform() ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleOpenSettings()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {t("nativePush.openSettingsCta")}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={handleLater}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t("nativePush.laterCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
