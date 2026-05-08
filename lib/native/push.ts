import { isNativeApp } from "@/lib/native/capacitor";
import { isValidFcmTokenShape } from "@/lib/pushTokenValidation";

/** Development of `NEXT_PUBLIC_NATIVE_PUSH_DEBUG=true`: gestapelde push-stappen (geen raw tokens). */
export function nativePushDevLog(...args: unknown[]): void {
  const enabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_NATIVE_PUSH_DEBUG === "true";
  if (!enabled || typeof console === "undefined") return;
  console.log("[hc-native-push]", ...args);
}

/**
 * Serialiseert alle Capacitor push-register flows. Parallelle `register()` calls
 * kunnen de Android-bridge laten crashen / undefined gedrag geven.
 */
let pushOpChain: Promise<void> = Promise.resolve();

export function enqueueNativePushOperation<T>(fn: () => Promise<T>): Promise<T> {
  const next = pushOpChain.then(() => fn());
  pushOpChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export type NativePushStatusCode =
  | "unsupported"
  | "permission_denied"
  | "registered"
  | "registration_error";

export class NativePushError extends Error {
  readonly code: NativePushStatusCode;

  constructor(code: NativePushStatusCode, message: string) {
    super(message);
    this.name = "NativePushError";
    this.code = code;
  }
}

/** Alleen native Capacitor-shell (geen browser-webpush in deze stap). */
export function isPushAvailable(): boolean {
  return isNativeApp();
}

function mapRegistrationFailure(message: string): NativePushError {
  const lower = message.toLowerCase();
  if (
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("not authorized")
  ) {
    return new NativePushError(
      "permission_denied",
      "Pushmeldingen zijn niet toegestaan."
    );
  }
  return new NativePushError(
    "registration_error",
    message || "Registratie voor pushmeldingen mislukt."
  );
}

/** Masker voor UI: eerste 12 + laatste 8 tekens. */
export function maskPushTokenForDisplay(token: string): string {
  const t = token.trim();
  if (t.length <= 20) return "••••••••";
  return `${t.slice(0, 12)}…${t.slice(-8)}`;
}

/**
 * Vraagt POST_NOTIFICATIONS (Android 13+) / iOS-equivalent via Capacitor.
 * Geeft `{ granted: true }` als `receive === 'granted'`.
 */
export type NativeOsPushPermission = "granted" | "denied" | "prompt";

export async function getNativePushPermissionState(): Promise<NativeOsPushPermission> {
  if (!isPushAvailable()) {
    return "prompt";
  }
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.checkPermissions();
    const receive = String(
      (perm as { receive?: string }).receive ?? "prompt"
    );
    if (receive === "granted") return "granted";
    if (receive === "denied") return "denied";
    return "prompt";
  } catch {
    return "prompt";
  }
}

export async function requestNativePushPermission(): Promise<{
  granted: boolean;
  receive: string;
}> {
  if (!isPushAvailable()) {
    throw new NativePushError(
      "unsupported",
      "Push is alleen beschikbaar in de native HomeCheff-app."
    );
  }
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const status = await PushNotifications.requestPermissions();
    const receive = String(
      (status as { receive?: string }).receive ?? "prompt"
    );
    return { granted: receive === "granted", receive };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    nativePushDevLog("requestPermissions threw", msg);
    throw mapRegistrationFailure(msg);
  }
}

/**
 * Registreert bij FCM/APNs. Zet vóór aanroep listeners op `registration` en
 * `registrationError`, anders mis je het token.
 */
export async function registerNativePushNotifications(): Promise<void> {
  if (!isPushAvailable()) {
    throw new NativePushError(
      "unsupported",
      "Push is alleen beschikbaar in de native HomeCheff-app."
    );
  }
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.register();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    nativePushDevLog("registerNativePushNotifications threw", msg);
    throw mapRegistrationFailure(msg);
  }
}

export type NativePushDebugListenerOptions = {
  onNotificationReceived?: (info: {
    title?: string;
    body?: string;
    id: string;
  }) => void;
  onActionPerformed?: (info: { actionId: string; summary: string }) => void;
};

/**
 * Luistert naar inkomende pushes en notification-taps (debug).
 * Geen top-level plugin-import; veilig voor SSR.
 */
export async function setupNativePushDebugListeners(
  options: NativePushDebugListenerOptions = {}
): Promise<() => Promise<void>> {
  if (!isPushAvailable()) {
    return async () => {};
  }
  const { PushNotifications } = await import("@capacitor/push-notifications");

  let h1: { remove: () => Promise<void> } | null = null;
  let h2: { remove: () => Promise<void> } | null = null;

  try {
    h1 = await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        nativePushDevLog("notification received", notification?.id);
        options.onNotificationReceived?.({
          title: notification.title,
          body: notification.body,
          id: notification.id,
        });
      }
    );
  } catch (e) {
    nativePushDevLog("addListener pushNotificationReceived failed", e);
  }

  try {
    h2 = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (event) => {
        nativePushDevLog("action performed", event?.actionId);
        const n = event.notification;
        const summary =
          [n.title, n.body].filter(Boolean).join(" — ") || "notification tap";
        options.onActionPerformed?.({
          actionId: event.actionId ?? "",
          summary,
        });
      }
    );
  } catch (e) {
    nativePushDevLog("addListener pushNotificationActionPerformed failed", e);
  }

  return async () => {
    try {
      await h1?.remove();
    } catch {
      /* ignore */
    }
    try {
      await h2?.remove();
    } catch {
      /* ignore */
    }
  };
}

const REGISTRATION_TIMEOUT_MS = 45_000;

/**
 * User action: permissie + register + wacht op FCM-token (via registration event).
 */
export async function requestAndRegisterNativePush(): Promise<string> {
  return enqueueNativePushOperation(async () => {
    if (!isPushAvailable()) {
      throw new NativePushError(
        "unsupported",
        "Push is alleen beschikbaar in de native HomeCheff-app."
      );
    }

    const { PushNotifications } = await import("@capacitor/push-notifications");

    nativePushDevLog("permission request started");
    let receive: string;
    try {
      const perm = await PushNotifications.requestPermissions();
      receive = String((perm as { receive?: string }).receive ?? "prompt");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      nativePushDevLog("requestPermissions threw", msg);
      throw mapRegistrationFailure(msg);
    }
    nativePushDevLog("permission result", receive);

    if (receive !== "granted") {
      throw new NativePushError(
        "permission_denied",
        "Pushmeldingen zijn geweigerd. Schakel meldingen in via Android-instellingen."
      );
    }

    let settled = false;
    let resolveToken!: (value: string) => void;
    let rejectToken!: (reason: Error) => void;
    const tokenPromise = new Promise<string>((resolve, reject) => {
      resolveToken = resolve;
      rejectToken = reject;
    });

    let regHandle: { remove: () => Promise<void> } | null = null;
    let errHandle: { remove: () => Promise<void> } | null = null;

    try {
      regHandle = await PushNotifications.addListener(
        "registration",
        ({ value }) => {
          if (settled) return;
          settled = true;
          resolveToken(value);
        }
      );
    } catch (e) {
      nativePushDevLog("addListener registration failed", e);
      throw mapRegistrationFailure(
        e instanceof Error ? e.message : "addListener registration"
      );
    }

    try {
      errHandle = await PushNotifications.addListener(
        "registrationError",
        (err) => {
          if (settled) return;
          settled = true;
          rejectToken(
            mapRegistrationFailure(
              typeof err?.error === "string" ? err.error : "registrationError"
            )
          );
        }
      );
    } catch (e) {
      nativePushDevLog("addListener registrationError failed", e);
      try {
        await regHandle?.remove();
      } catch {
        /* ignore */
      }
      throw mapRegistrationFailure(
        e instanceof Error ? e.message : "addListener registrationError"
      );
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(
          new NativePushError(
            "registration_error",
            "Timeout bij ophalen van push-token. Controleer google-services.json en netwerk."
          )
        );
      }, REGISTRATION_TIMEOUT_MS);
    });

    try {
      try {
        await PushNotifications.register();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        nativePushDevLog("PushNotifications.register threw", msg);
        throw mapRegistrationFailure(msg);
      }
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      nativePushDevLog("token received (masked)", maskPushTokenForDisplay(token));
      if (!isValidFcmTokenShape(token)) {
        throw new NativePushError(
          "registration_error",
          "Ongeldig push-token ontvangen. Controleer Firebase/google-services configuratie."
        );
      }
      return token;
    } finally {
      try {
        await regHandle?.remove();
      } catch {
        /* ignore */
      }
      try {
        await errHandle?.remove();
      } catch {
        /* ignore */
      }
    }
  });
}

const REGISTRATION_TIMEOUT_MS_GRANTED = 45_000;

/**
 * Haalt FCM-token op zonder permissie te vragen.
 * Alleen als `checkPermissions` al `granted` is (geen prompt).
 * Anders `null`.
 */
export async function getNativeFcmTokenWhenAlreadyGranted(): Promise<string | null> {
  if (!isPushAvailable()) {
    return null;
  }
  const { PushNotifications } = await import("@capacitor/push-notifications");
  let receive: string;
  try {
    const perm = await PushNotifications.checkPermissions();
    receive = String((perm as { receive?: string }).receive ?? "prompt");
  } catch {
    return null;
  }
  if (receive !== "granted") {
    return null;
  }

  nativePushDevLog("getNativeFcmTokenWhenAlreadyGranted: queued register");

  try {
    return await enqueueNativePushOperation(async () => {
      let settled = false;
      let resolveToken!: (value: string) => void;
      let rejectToken!: (reason: Error) => void;
      const tokenPromise = new Promise<string>((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
      });

      let regHandle: { remove: () => Promise<void> } | null = null;
      let errHandle: { remove: () => Promise<void> } | null = null;

      try {
        regHandle = await PushNotifications.addListener(
          "registration",
          ({ value }) => {
            if (settled) return;
            settled = true;
            resolveToken(value);
          }
        );
        errHandle = await PushNotifications.addListener(
          "registrationError",
          (err) => {
            if (settled) return;
            settled = true;
            rejectToken(
              mapRegistrationFailure(
                typeof err?.error === "string" ? err.error : "registrationError"
              )
            );
          }
        );
      } catch {
        return null;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(
            new NativePushError(
              "registration_error",
              "Timeout bij ophalen van push-token."
            )
          );
        }, REGISTRATION_TIMEOUT_MS_GRANTED);
      });

      try {
        try {
          await PushNotifications.register();
        } catch {
          return null;
        }
        const token = await Promise.race([tokenPromise, timeoutPromise]);
        nativePushDevLog(
          "token sync (masked)",
          maskPushTokenForDisplay(token)
        );
        return isValidFcmTokenShape(token) ? token : null;
      } catch {
        return null;
      } finally {
        try {
          await regHandle?.remove();
        } catch {
          /* ignore */
        }
        try {
          await errHandle?.remove();
        } catch {
          /* ignore */
        }
      }
    });
  } catch {
    return null;
  }
}
