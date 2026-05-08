/**
 * Bundled voor dist/ — alleen Capacitor listeners op de lokale startup-shell.
 * Build: zie scripts/prepare-capacitor-webdir.mjs
 */
import { App } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  pathFromPushNotificationData,
  storePendingNativeRoute,
} from "../lib/native/pushDeepLink";

function init(): void {
  if (typeof window === "undefined") return;

  void PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (event) => {
      const data = event.notification?.data as
        | Record<string, unknown>
        | undefined;
      const path = pathFromPushNotificationData(data);
      if (path) storePendingNativeRoute(path);
    }
  ).catch(() => {});

  void App.addListener("backButton", ({ canGoBack }) => {
    try {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    } catch {
      /* ignore */
    }
  }).catch(() => {});
}

init();
