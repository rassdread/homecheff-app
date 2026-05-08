/**
 * Firebase Admin (server-only) voor FCM. Geen throw als env ontbreekt — push wordt dan overgeslagen.
 */
import admin from "firebase-admin";

let loggedMissingConfig = false;
let loggedInvalidPem = false;
let initFailed = false;
let devReadyLogged = false;

function logDevReady(ok: boolean): void {
  if (process.env.NODE_ENV === "production") return;
  if (devReadyLogged) return;
  devReadyLogged = true;
  console.info(`[firebase-admin] ready ${ok}`);
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Singleton messaging client. `null` als credentials ontbreken of init faalt.
 */
export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (initFailed) {
    return null;
  }

  if (!isFirebaseAdminConfigured()) {
    if (!loggedMissingConfig) {
      loggedMissingConfig = true;
      console.warn(
        "[firebase-admin] FCM uit: zet FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }
    logDevReady(false);
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
      const pemOk =
        privateKey.includes("BEGIN PRIVATE KEY") &&
        privateKey.includes("END PRIVATE KEY");
      if (!pemOk) {
        initFailed = true;
        if (!loggedInvalidPem) {
          loggedInvalidPem = true;
          console.warn(
            "[firebase-admin] FIREBASE_PRIVATE_KEY mist PEM-markers (BEGIN/END PRIVATE KEY); FCM uit"
          );
        }
        logDevReady(false);
        return null;
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey,
        }),
      });
    }
    logDevReady(true);
    return admin.messaging();
  } catch (e) {
    initFailed = true;
    console.error(
      "[firebase-admin] Init mislukt:",
      e instanceof Error ? e.message : e
    );
    logDevReady(false);
    return null;
  }
}
