"use client";

import { isNativeApp } from "@/lib/native/capacitor";
import {
  recordPushServerSyncTime,
  shouldThrottlePushServerSync,
} from "@/lib/native/pushClientPrefs";
import { setCachedPushRegistrationId } from "@/lib/native/pushRegistrationCache";
import { maskPushTokenForLogs } from "@/lib/pushTokenValidation";

export type PushTokenServerResult =
  | "ok"
  | "unauthorized"
  | "bad_request"
  | "error";

/**
 * POST FCM-token naar backend. Alleen zinvol in Capacitor native shell.
 * Geen throw: 401/offline worden als resultaat teruggegeven.
 */
export async function registerFcmTokenWithServer(
  token: string,
  platform: "android" | "ios" | "web" = "android",
  deviceId?: string | null,
  options?: { force?: boolean }
): Promise<PushTokenServerResult> {
  if (!isNativeApp()) return "error";
  if (!options?.force && shouldThrottlePushServerSync(token)) {
    return "ok";
  }
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
    if (res.status === 401) return "unauthorized";
    if (res.status === 400) return "bad_request";
    if (!res.ok) return "error";
    setCachedPushRegistrationId(token);
    recordPushServerSyncTime();
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[HomeCheff push] server register OK",
        maskPushTokenForLogs(token)
      );
    }
    return "ok";
  } catch {
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
