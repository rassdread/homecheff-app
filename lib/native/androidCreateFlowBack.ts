"use client";

type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

let bridgeStarted = false;

/**
 * Register a handler for Android hardware back (Capacitor). Last registered runs first.
 * Return true if the event was consumed (navigation inside app handled).
 */
export function pushAndroidBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/**
 * Single Capacitor listener: walks handler stack, then falls back to browser history.
 */
export function ensureAndroidCreateFlowBackBridge(): void {
  if (bridgeStarted || typeof window === "undefined") return;

  const run = async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      await App.addListener("backButton", () => {
        for (let i = handlers.length - 1; i >= 0; i--) {
          try {
            if (handlers[i]()) return;
          } catch {
            /* continue */
          }
        }
        try {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
          } else if (typeof window !== 'undefined') {
            window.location.assign('/');
          }
        } catch {
          try {
            if (typeof window !== 'undefined') window.location.assign('/');
          } catch {
            /* ignore */
          }
        }
      });
      bridgeStarted = true;
    } catch {
      /* no Capacitor / plugin unavailable */
    }
  };

  void run();
}
