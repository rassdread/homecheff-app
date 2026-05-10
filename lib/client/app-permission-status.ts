import { Capacitor } from "@capacitor/core";

export type PermUiState = "granted" | "denied" | "prompt" | "unsupported";

function mapReceiveToUi(receive: string): PermUiState {
  if (receive === "granted") return "granted";
  if (receive === "denied") return "denied";
  return "prompt";
}

/** Push: native Capacitor-state, anders browser Notification.permission. */
export async function getPushPermissionForSettings(): Promise<{
  source: "native" | "browser";
  state: PermUiState;
}> {
  if (typeof window === "undefined") {
    return { source: "browser", state: "prompt" };
  }
  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const perm = await PushNotifications.checkPermissions();
      const receive = String(
        (perm as { receive?: string }).receive ?? "prompt"
      );
      return { source: "native", state: mapReceiveToUi(receive) };
    } catch {
      return { source: "native", state: "prompt" };
    }
  }
  if (typeof Notification === "undefined") {
    return { source: "browser", state: "unsupported" };
  }
  const p = Notification.permission;
  if (p === "granted") return { source: "browser", state: "granted" };
  if (p === "denied") return { source: "browser", state: "denied" };
  return { source: "browser", state: "prompt" };
}

export async function requestPushPermissionFromSettings(): Promise<PermUiState> {
  if (typeof window === "undefined") return "prompt";
  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const r = await PushNotifications.requestPermissions();
      const receive = String((r as { receive?: string }).receive ?? "prompt");
      return mapReceiveToUi(receive);
    } catch {
      return "denied";
    }
  }
  if (typeof Notification === "undefined" || !Notification.requestPermission) {
    return "unsupported";
  }
  try {
    const r = await Notification.requestPermission();
    if (r === "granted") return "granted";
    if (r === "denied") return "denied";
    return "prompt";
  } catch {
    return "denied";
  }
}

/** Locatie: native Capacitor Geolocation, anders Permissions API (geolocation). */
export async function getLocationPermissionForSettings(): Promise<{
  source: "native" | "browser";
  state: PermUiState;
}> {
  if (typeof window === "undefined") {
    return { source: "browser", state: "prompt" };
  }
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const p = await Geolocation.checkPermissions();
      const loc = String(p.location ?? "");
      const coarse = String((p as { coarseLocation?: string }).coarseLocation ?? "");
      if (loc === "granted" || coarse === "granted") {
        return { source: "native", state: "granted" };
      }
      if (loc === "denied" && coarse === "denied") {
        return { source: "native", state: "denied" };
      }
      return { source: "native", state: "prompt" };
    } catch {
      return { source: "native", state: "prompt" };
    }
  }
  if (!navigator.permissions?.query) {
    return { source: "browser", state: "prompt" };
  }
  try {
    const r = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    if (r.state === "granted") return { source: "browser", state: "granted" };
    if (r.state === "denied") return { source: "browser", state: "denied" };
    return { source: "browser", state: "prompt" };
  } catch {
    return { source: "browser", state: "prompt" };
  }
}
