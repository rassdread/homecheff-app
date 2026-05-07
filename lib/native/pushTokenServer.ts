"use client";

import { isNativeApp } from "@/lib/native/capacitor";
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
  platform: "android" | "ios" | "web" = "android"
): Promise<PushTokenServerResult> {
  if (!isNativeApp()) return "error";
  try {
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token, platform, type: "FCM" }),
    });
    if (res.status === 401) return "unauthorized";
    if (res.status === 400) return "bad_request";
    if (!res.ok) return "error";
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
