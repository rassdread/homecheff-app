"use client";

import { isNativeApp } from "@/lib/native/capacitor";
import {
  recordPushServerSyncTime,
  shouldThrottlePushServerSync,
} from "@/lib/native/pushClientPrefs";
import { setCachedPushRegistrationId } from "@/lib/native/pushRegistrationCache";
import { maskPushTokenForLogs } from "@/lib/pushTokenValidation";
import { reportAppDiagnostic } from "@/lib/diagnostics/appDiagnostics";

export type PushTokenServerResult =
  | "ok"
  | "unauthorized"
  | "bad_request"
  | "error";

export type RegisterFcmTokenOptions = {
  force?: boolean;
  /** Capacitor App.getInfo().version — throttle bypass na app-update. */
  appVersion?: string | null;
  /** Alleen voor diagnosen (geen gevoelige data). */
  diagReason?: "mount" | "resume" | "manual" | "post_permission" | "post_update";
};

/**
 * POST FCM-token naar backend. Alleen zinvol in Capacitor native shell.
 * Geen throw: 401/offline worden als resultaat teruggegeven.
 */
export async function registerFcmTokenWithServer(
  token: string,
  platform: "android" | "ios" | "web" = "android",
  deviceId?: string | null,
  options?: RegisterFcmTokenOptions
): Promise<PushTokenServerResult> {
  if (!isNativeApp()) return "error";

  const throttleOpts = {
    appVersion: options?.appVersion,
    force: Boolean(options?.force),
  };

  if (shouldThrottlePushServerSync(token, throttleOpts)) {
    reportAppDiagnostic("push_token_sync_skipped", {
      reason: options?.force ? "throttle_forced_interval" : "throttle_unchanged",
      diagReason: options?.diagReason ?? "mount",
    });
    return "ok";
  }

  reportAppDiagnostic("push_token_sync_started", {
    diagReason: options?.diagReason ?? "mount",
    forced: Boolean(options?.force),
  });

  try {
    const body: Record<string, unknown> = {
      token,
      platform,
      type: "FCM",
    };
    if (deviceId?.trim()) {
      body.deviceId = deviceId.trim().slice(0, 128);
    }
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      reportAppDiagnostic("push_token_sync_failed", {
        httpStatus: 401,
        diagReason: options?.diagReason ?? "mount",
      });
      return "unauthorized";
    }
    if (res.status === 400) {
      reportAppDiagnostic("push_token_sync_failed", {
        httpStatus: 400,
        diagReason: options?.diagReason ?? "mount",
      });
      return "bad_request";
    }
    if (!res.ok) {
      reportAppDiagnostic("push_register_api_failed", {
        httpStatus: res.status,
        diagReason: options?.diagReason ?? "mount",
      });
      return "error";
    }
    setCachedPushRegistrationId(token);
    recordPushServerSyncTime(options?.appVersion);
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[HomeCheff push] server register OK",
        maskPushTokenForLogs(token)
      );
    }
    reportAppDiagnostic("push_token_sync_success", {
      diagReason: options?.diagReason ?? "mount",
    });
    return "ok";
  } catch {
    reportAppDiagnostic("push_token_sync_failed", {
      diagReason: options?.diagReason ?? "mount",
      network: true,
    });
    return "error";
  }
}

export async function unregisterFcmTokenWithServer(
  token: string
): Promise<PushTokenServerResult> {
  if (!isNativeApp()) return "error";
  try {
    const res = await fetch("/api/push/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token }),
    });
    if (res.status === 401) return "unauthorized";
    if (res.status === 400) return "bad_request";
    if (!res.ok) return "error";
    return "ok";
  } catch {
    return "error";
  }
}
