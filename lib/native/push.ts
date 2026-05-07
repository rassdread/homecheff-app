import { isNativeApp } from "@/lib/native/capacitor";

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
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const status = await PushNotifications.requestPermissions();
  const receive = String(
    (status as { receive?: string }).receive ?? "prompt"
  );
  return { granted: receive === "granted", receive };
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
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.register();
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

  const h1 = await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log("[HomeCheff push] notification received", notification);
      options.onNotificationReceived?.({
        title: notification.title,
        body: notification.body,
        id: notification.id,
      });
    }
  );

  const h2 = await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (event) => {
      console.log("[HomeCheff push] action performed", event);
      const n = event.notification;
      const summary =
        [n.title, n.body].filter(Boolean).join(" — ") || "notification tap";
      options.onActionPerformed?.({
        actionId: event.actionId ?? "",
        summary,
      });
    }
  );

  return async () => {
    try {
      await h1.remove();
    } catch {
      /* ignore */
    }
    try {
      await h2.remove();
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
  if (!isPushAvailable()) {
    throw new NativePushError(
      "unsupported",
      "Push is alleen beschikbaar in de native HomeCheff-app."
    );
  }

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const perm = await PushNotifications.requestPermissions();
  const receive = String(
    (perm as { receive?: string }).receive ?? "prompt"
  );
  if (receive !== "granted") {
    throw new NativePushError(
      "permission_denied",
      "Pushmeldingen zijn geweigerd. Schakel meldingen in via Android-instellingen."
    );
  }

  let settled = false;
  let resolveToken: (value: string) => void;
  let rejectToken: (reason: Error) => void;
  const tokenPromise = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });

  const regHandle = await PushNotifications.addListener(
    "registration",
    ({ value }) => {
      if (settled) return;
      settled = true;
      resolveToken(value);
    }
  );

  const errHandle = await PushNotifications.addListener(
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
    await PushNotifications.register();
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    if (process.env.NODE_ENV === "development") {
      console.log("[HomeCheff push] full FCM token", token);
    }
    return token;
  } finally {
    try {
      await regHandle.remove();
    } catch {
      /* ignore */
    }
    try {
      await errHandle.remove();
    } catch {
      /* ignore */
    }
  }
}
