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

/** Testvlag: slaat alle native `PushNotifications.register()`-aanroepen over (geen crash tijdens onderzoek). */
export function isNativePushRegisterDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_NATIVE_PUSH_REGISTER === "true";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Na systeem permissiedialog: wacht tot tab/WebView weer zichtbaar is vóór zware native register. */
async function waitUntilDocumentVisible(): Promise<void> {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") return;
  await new Promise<void>((resolve) => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVis);
      resolve();
    };
    document.addEventListener("visibilitychange", onVis);
  });
}

/**
 * Registreert bij FCM/APNs na listeners op `registration` / `registrationError`.
 * Vereist dat permissie al granted is.
 */
async function registerNativePushAndAwaitToken(): Promise<string> {
  if (!isPushAvailable()) {
    throw new NativePushError(
      "unsupported",
      "Push is alleen beschikbaar in de native HomeCheff-app."
    );
  }
  if (isNativePushRegisterDisabled()) {
    throw new NativePushError(
      "registration_error",
      "Native push-registratie is uitgeschakeld (NEXT_PUBLIC_DISABLE_NATIVE_PUSH_REGISTER)."
    );
  }

  const { PushNotifications } = await import("@capacitor/push-notifications");

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

  const REGISTRATION_TIMEOUT_MS = 45_000;
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
}

/**
 * Registreert bij FCM/APNs. Zet vóór aanroep listeners op `registration` en
 * `registrationError`, anders mis je het token.
 */
export async function registerNativePushNotifications(): Promise<void> {
  await registerNativePushAndAwaitToken();
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

const REGISTER_DELAY_MIN_MS = 800;
const REGISTER_DELAY_MAX_MS = 1500;

/**
 * User action: permissie → korte pauze (Android permission/WebView-race) → register → FCM-token.
 */
export async function requestAndRegisterNativePush(): Promise<string> {
  return enqueueNativePushOperation(async () => {
    if (!isPushAvailable()) {
      throw new NativePushError(
        "unsupported",
        "Push is alleen beschikbaar in de native HomeCheff-app."
      );
    }
    if (isNativePushRegisterDisabled()) {
      throw new NativePushError(
        "registration_error",
        "Native push-registratie staat uit (NEXT_PUBLIC_DISABLE_NATIVE_PUSH_REGISTER)."
      );
    }

    nativePushDevLog("permission request (split from register)");
    let granted: boolean;
    try {
      const result = await requestNativePushPermission();
      granted = result.granted;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      nativePushDevLog("requestNativePushPermission threw", msg);
      if (e instanceof NativePushError) throw e;
      throw mapRegistrationFailure(msg);
    }

    if (!granted) {
      throw new NativePushError(
        "permission_denied",
        "Pushmeldingen zijn geweigerd. Schakel meldingen in via Android-instellingen."
      );
    }

    const jitter =
      REGISTER_DELAY_MIN_MS +
      Math.floor(
        Math.random() * (REGISTER_DELAY_MAX_MS - REGISTER_DELAY_MIN_MS + 1)
      );
    nativePushDevLog("delay before register (ms)", jitter);
    await sleep(jitter);
    await waitUntilDocumentVisible();

    return registerNativePushAndAwaitToken();
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
  if (isNativePushRegisterDisabled()) {
    nativePushDevLog("getNativeFcmTokenWhenAlreadyGranted: register disabled via env");
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
