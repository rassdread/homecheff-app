import { isNativeApp } from "@/lib/native/capacitor";

export type NativeLocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type NativeLocationErrorCode =
  | "not_native"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export class NativeLocationError extends Error {
  readonly code: NativeLocationErrorCode;

  constructor(code: NativeLocationErrorCode, message: string) {
    super(message);
    this.name = "NativeLocationError";
    this.code = code;
  }
}

function mapPluginError(e: unknown): NativeLocationError {
  const msg =
    e instanceof Error ? e.message : typeof e === "string" ? e : "Onbekende fout";
  const lower = msg.toLowerCase();
  if (
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("not authorized")
  ) {
    return new NativeLocationError(
      "denied",
      "Locatietoegang geweigerd. Schakel locatie in via instellingen."
    );
  }
  if (lower.includes("timeout")) {
    return new NativeLocationError(
      "timeout",
      "Locatie niet op tijd ontvangen. Probeer opnieuw."
    );
  }
  if (
    lower.includes("unavailable") ||
    lower.includes("disabled") ||
    lower.includes("location services")
  ) {
    return new NativeLocationError(
      "unavailable",
      "Locatie is niet beschikbaar (bijv. uitgeschakeld in systeeminstellingen)."
    );
  }
  return new NativeLocationError("unknown", msg);
}

/**
 * Vraagt runtime-locatierechten (Android/iOS). Op web / niet-native: no-op geweigerd.
 */
export async function requestNativeLocationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const status = await Geolocation.requestPermissions();
    const ok =
      status.location === "granted" || status.coarseLocation === "granted";
    return ok;
  } catch (e) {
    throw mapPluginError(e);
  }
}

/**
 * Huidige positie via Capacitor Geolocation. Alleen in native shell; anders fout `not_native`.
 * Roept geen requestPermissions aan — gebruik eerst requestNativeLocationPermission of
 * requestAndGetNativeCurrentPosition.
 */
export async function getNativeCurrentPosition(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<NativeLocationCoords> {
  if (!isNativeApp()) {
    throw new NativeLocationError(
      "not_native",
      "Geen native app (Capacitor) — gebruik de browser-locatieflow."
    );
  }
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 20000,
      maximumAge: options?.maximumAge ?? 0,
    });
    const { latitude, longitude, accuracy } = pos.coords;
    return {
      latitude,
      longitude,
      accuracy: typeof accuracy === "number" && Number.isFinite(accuracy)
        ? accuracy
        : null,
    };
  } catch (e) {
    if (e instanceof NativeLocationError) throw e;
    throw mapPluginError(e);
  }
}

/**
 * Eén user action: permissie + huidige positie. Geschikt voor knoppen (geen auto op page load).
 */
export async function requestAndGetNativeCurrentPosition(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<NativeLocationCoords> {
  if (!isNativeApp()) {
    throw new NativeLocationError(
      "not_native",
      "Geen native app (Capacitor) — gebruik de browser-locatieflow."
    );
  }
  const granted = await requestNativeLocationPermission();
  if (!granted) {
    throw new NativeLocationError(
      "denied",
      "Locatietoegang geweigerd. Sta locatie toe voor de HomeCheff-app."
    );
  }
  return getNativeCurrentPosition(options);
}
