"use client";

import {
  clearCachedPushRegistrationId,
  getCachedPushRegistrationId,
} from "@/lib/native/pushRegistrationCache";
import { unregisterFcmTokenWithServer } from "@/lib/native/pushTokenServer";

/**
 * Zet server-side PushToken op inactief vóór lokale cleanup (sessie nog geldig voor DELETE).
 */
export async function unregisterNativePushTokenBeforeLogout(): Promise<void> {
  const token = getCachedPushRegistrationId();
  if (!token) return;
  try {
    await unregisterFcmTokenWithServer(token);
  } finally {
    clearCachedPushRegistrationId();
  }
}
