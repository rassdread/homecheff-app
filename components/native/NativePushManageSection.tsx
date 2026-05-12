"use client";

import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Smartphone, ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { openAndroidAppDetailSettings } from "@/lib/native/openAndroidAppSettings";
import {
  NativePushError,
  getNativePushPermissionState,
  requestAndRegisterNativePush,
  type NativeOsPushPermission,
} from "@/lib/native/push";
import { getOrCreatePushDeviceId } from "@/lib/native/pushClientPrefs";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";
import { getCapacitorAppInfo } from "@/lib/native/getCapacitorAppInfo";

type Props = {
  /** Na succesvolle registratie (bijv. parent prefs herladen). */
  onRegistered?: () => void;
};

export default function NativePushManageSection({ onRegistered }: Props) {
  const { t } = useTranslation();
  const nativeMounted = useIsNativeAppMounted();
  const [perm, setPerm] = useState<NativeOsPushPermission | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!nativeMounted) return;
    const p = await getNativePushPermissionState();
    setPerm(p);
  }, [nativeMounted]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const handleEnablePush = async () => {
    if (!nativeMounted || busy) return;
    setBusy(true);
    try {
      const token = await requestAndRegisterNativePush();
      const platform =
        Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const deviceId = getOrCreatePushDeviceId();
      const appInfo = await getCapacitorAppInfo();
      const reg = await registerFcmTokenWithServer(token, platform, deviceId, {
        force: true,
        appVersion: appInfo.version,
        diagReason: "manual",
      });
      if (reg !== "ok") {
        alert(t("nativePush.registerError"));
      } else {
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pushNewMessages: true }),
        }).catch(() => {});
        onRegistered?.();
      }
      await refresh();
    } catch (e) {
      const msg =
        e instanceof NativePushError
          ? e.message
          : t("nativePush.registerError");
      alert(msg);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!nativeMounted) return null;

  const statusLabel =
    perm === "granted"
      ? t("nativePush.statusAllowed")
      : perm === "denied"
        ? t("nativePush.statusDenied")
        : t("nativePush.statusPrompt");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-emerald-700" aria-hidden />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("nativePush.manageTitle")}
        </h3>
      </div>
      <p className="mt-2 text-sm text-gray-700">
        <span className="font-medium">{t("nativePush.deviceStatus")}</span>{" "}
        {statusLabel}
      </p>
      <p className="mt-2 text-xs text-gray-600">{t("nativePush.manageHint")}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy || perm === "granted"}
          onClick={() => void handleEnablePush()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("common.sending") : t("nativePush.turnOn")}
        </button>
        {perm === "denied" && Capacitor.getPlatform() === "android" ? (
          <button
            type="button"
            onClick={() => openAndroidAppDetailSettings()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-400 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t("nativePush.openAndroidSettings")}
          </button>
        ) : null}
        {perm === "denied" && Capacitor.getPlatform() === "ios" ? (
          <p className="text-sm text-gray-700">{t("nativePush.openIosHint")}</p>
        ) : null}
      </div>
    </div>
  );
}
